import json
import os
import logging

import stripe
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import StoryOrder
from .serializers import StoryOrderCreateSerializer, StoryOrderOutputSerializer
from .claude_client import generate_story, extract_scene_descriptions
from .tts_client import generate_audio
from .image_client import generate_story_illustrations
from .video_client import generate_story_video

logger = logging.getLogger(__name__)

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

SKIP_STRIPE = os.getenv('SKIP_STRIPE', 'False') == 'True'


@api_view(['POST'])
def create_payment_intent(request):
    serializer = StoryOrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order = serializer.save()

    if SKIP_STRIPE:
        order.status = StoryOrder.Status.PAID
        order.save()
        return Response({
            'client_secret': None,
            'order_id': str(order.id),
            'skip_payment': True,
        })

    try:
        intent = stripe.PaymentIntent.create(
            amount=300,
            currency='usd',
            metadata={'order_id': str(order.id)},
            description='قصة نوم عربية مخصصة',
        )
        order.stripe_payment_intent_id = intent.id
        order.save()
    except stripe.error.StripeError as e:
        order.delete()
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'client_secret': intent.client_secret,
        'order_id': str(order.id),
    })


@api_view(['POST'])
def generate_story_view(request):
    order_id = request.data.get('order_id')
    if not order_id:
        return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = StoryOrder.objects.get(id=order_id)
    except StoryOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    # In dev mode with SKIP_STRIPE, order is already paid
    # Handle race condition: if webhook hasn't fired yet, verify payment directly
    if not SKIP_STRIPE and order.status == StoryOrder.Status.PENDING_PAYMENT and order.stripe_payment_intent_id:
        try:
            intent = stripe.PaymentIntent.retrieve(order.stripe_payment_intent_id)
            if intent.status == 'succeeded':
                order.status = StoryOrder.Status.PAID
                order.save()
        except stripe.error.StripeError:
            pass

    if order.status not in (StoryOrder.Status.PAID, StoryOrder.Status.GENERATING):
        return Response(
            {'error': 'Payment not confirmed', 'status': order.status},
            status=status.HTTP_400_BAD_REQUEST,
        )

    order.status = StoryOrder.Status.GENERATING
    order.save()

    try:
        story_text, title, moral = generate_story(order)
        order.story_text = story_text
        order.story_title = title
        order.story_moral = moral
        order.status = StoryOrder.Status.COMPLETED
        order.save()
    except Exception as e:
        logger.error(f"Story generation failed for order {order.id}: {e}")
        order.status = StoryOrder.Status.FAILED
        order.save()
        return Response({'error': 'فشل في إنشاء القصة'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'order_id': str(order.id),
        'status': order.status,
    })


@api_view(['GET'])
def get_story(request, order_id):
    try:
        order = StoryOrder.objects.get(id=order_id)
    except StoryOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = StoryOrderOutputSerializer(order, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def generate_audio_view(request):
    order_id = request.data.get('order_id')
    if not order_id:
        return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = StoryOrder.objects.get(id=order_id)
    except StoryOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != StoryOrder.Status.COMPLETED or not order.story_text:
        return Response({'error': 'Story not ready'}, status=status.HTTP_400_BAD_REQUEST)

    if order.audio_status == 'completed' and order.audio_file:
        return Response({
            'order_id': str(order.id),
            'audio_status': 'completed',
            'audio_url': request.build_absolute_uri(order.audio_file.url),
        })

    order.audio_status = 'generating'
    order.save()

    try:
        audio_url = generate_audio(order)
        return Response({
            'order_id': str(order.id),
            'audio_status': 'completed',
            'audio_url': request.build_absolute_uri(audio_url),
        })
    except Exception as e:
        logger.error(f"Audio generation failed for order {order.id}: {e}")
        order.audio_status = 'failed'
        order.save()
        return Response({'error': 'فشل في إنشاء الصوت'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generate_illustrations_view(request):
    order_id = request.data.get('order_id')
    if not order_id:
        return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = StoryOrder.objects.get(id=order_id)
    except StoryOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != StoryOrder.Status.COMPLETED or not order.story_text:
        return Response({'error': 'Story not ready'}, status=status.HTTP_400_BAD_REQUEST)

    if order.illustrations_status == 'completed' and order.illustrations.exists():
        from .serializers import StoryIllustrationSerializer
        illustrations = StoryIllustrationSerializer(
            order.illustrations.all(), many=True, context={'request': request}
        ).data
        return Response({
            'order_id': str(order.id),
            'illustrations_status': 'completed',
            'illustrations': illustrations,
        })

    order.illustrations_status = 'generating'
    order.save()

    try:
        scene_descriptions = extract_scene_descriptions(order.story_text, order)
        illustrations = generate_story_illustrations(order, scene_descriptions)
        order.illustrations_status = 'completed'
        order.save()

        from .serializers import StoryIllustrationSerializer
        illustrations_data = StoryIllustrationSerializer(
            illustrations, many=True, context={'request': request}
        ).data

        return Response({
            'order_id': str(order.id),
            'illustrations_status': 'completed',
            'illustrations': illustrations_data,
        })
    except Exception as e:
        logger.error(f"Illustrations generation failed for order {order.id}: {e}")
        order.illustrations_status = 'failed'
        order.save()
        return Response({'error': 'فشل في إنشاء الرسومات'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generate_video_view(request):
    order_id = request.data.get('order_id')
    if not order_id:
        return Response({'error': 'order_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = StoryOrder.objects.get(id=order_id)
    except StoryOrder.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    if order.status != StoryOrder.Status.COMPLETED or not order.story_text:
        return Response({'error': 'Story not ready'}, status=status.HTTP_400_BAD_REQUEST)

    if order.illustrations_status != 'completed' or not order.illustrations.exists():
        return Response({'error': 'Illustrations not ready'}, status=status.HTTP_400_BAD_REQUEST)

    if order.video_status == 'completed' and order.video_clips.exists():
        from .serializers import StoryVideoClipSerializer
        clips_data = StoryVideoClipSerializer(
            order.video_clips.all(), many=True, context={'request': request}
        ).data
        return Response({
            'order_id': str(order.id),
            'video_status': 'completed',
            'video_clips': clips_data,
        })

    order.video_status = 'generating'
    order.save()

    try:
        clips = generate_story_video(order)
        order.video_status = 'completed'
        order.save()

        from .serializers import StoryVideoClipSerializer
        clips_data = StoryVideoClipSerializer(
            clips, many=True, context={'request': request}
        ).data

        return Response({
            'order_id': str(order.id),
            'video_status': 'completed',
            'video_clips': clips_data,
        })
    except Exception as e:
        logger.error(f"Video generation failed for order {order.id}: {e}")
        order.video_status = 'failed'
        order.save()
        return Response({'error': 'فشل في إنشاء الفيديو'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        order_id = intent.get('metadata', {}).get('order_id')
        if order_id:
            try:
                order = StoryOrder.objects.get(id=order_id)
                if order.status == StoryOrder.Status.PENDING_PAYMENT:
                    order.status = StoryOrder.Status.PAID
                    order.save()
            except StoryOrder.DoesNotExist:
                logger.warning(f"Webhook: order {order_id} not found")

    return HttpResponse(status=200)
