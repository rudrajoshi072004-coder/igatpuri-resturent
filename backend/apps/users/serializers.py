from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import CustomerProfile, DeliveryBoyProfile

User = get_user_model()


class UserMeSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "username", "name", "phone", "role", "is_active", "created_at"]

    def get_name(self, obj):
        full = (obj.get_full_name() or "").strip()
        return full or obj.username


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "phone", "password", "name"]

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        name = (validated_data.pop("name", "") or "").strip()
        email = (validated_data.get("email") or "").strip().lower()
        phone = (validated_data.get("phone") or "").strip()
        password = validated_data.pop("password")

        user = User(
            username=email or phone,
            email=email,
            phone=phone or None,
            role=User.Role.CUSTOMER,
            is_active=True,
        )
        if name:
            parts = name.split(" ", 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
        user.set_password(password)
        user.save()
        CustomerProfile.objects.get_or_create(user=user, defaults={"phone": user.phone or ""})
        return user


class AdminDeliveryBoyCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    name = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    vehicle_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["id", "email", "password", "name", "phone", "vehicle_number", "is_active"]

    def create(self, validated_data):
        name = validated_data.pop("name")
        vehicle_number = validated_data.pop("vehicle_number", "") or ""
        password = validated_data.pop("password")
        email = (validated_data.get("email") or "").strip().lower()

        user = User(
            username=email,
            email=email,
            phone=(validated_data.get("phone") or "").strip() or None,
            role=User.Role.DELIVERY_BOY,
            is_active=validated_data.get("is_active", True),
        )
        parts = (name or "").strip().split(" ", 1)
        user.first_name = parts[0] if parts else ""
        user.last_name = parts[1] if len(parts) > 1 else ""
        user.set_password(password)
        user.save()

        DeliveryBoyProfile.objects.get_or_create(
            user=user,
            defaults={
                "phone": user.phone or "",
                "vehicle_number": vehicle_number or "NA",
                "is_available": True,
            },
        )
        return user

