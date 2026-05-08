from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserMeSerializer

User = get_user_model()


def _tokens_for_user(user: User):
    refresh = RefreshToken.for_user(user)
    return {"refresh": str(refresh), "access": str(refresh.access_token)}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(
        {"user": UserMeSerializer(user).data, "tokens": _tokens_for_user(user)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response({"detail": "email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    # We store username as email for admin/delivery seed users; for customers too.
    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({"detail": "User is inactive"}, status=status.HTTP_403_FORBIDDEN)

    return Response({"user": UserMeSerializer(user).data, "tokens": _tokens_for_user(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserMeSerializer(request.user).data)

