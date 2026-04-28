"""
URL routes for the accounts app.

All mounted under /api/v1/auth/ by config/urls.py.
"""

from django.urls import path

from apps.accounts import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", views.TokenRefreshView.as_view(), name="token-refresh"),
    path("profile/", views.UserProfileView.as_view(), name="profile"),
    # Phone OTP verification
    path("phone/send-otp/", views.SendOTPView.as_view(), name="phone-send-otp"),
    path("phone/verify/", views.VerifyOTPView.as_view(), name="phone-verify"),
    path("phone/resend/", views.ResendOTPView.as_view(), name="phone-resend"),
    # Email OTP verification
    path("email/send-otp/", views.SendEmailOTPView.as_view(), name="email-send-otp"),
    path("email/verify/", views.VerifyEmailOTPView.as_view(), name="email-verify"),
    path("email/resend/", views.ResendEmailOTPView.as_view(), name="email-resend"),
    # Password reset
    path("password/forgot/", views.ForgotPasswordView.as_view(), name="password-forgot"),
    path("password/reset/", views.ResetPasswordView.as_view(), name="password-reset"),
    # Seller upgrade
    path("upgrade-to-seller/", views.UpgradeToSellerView.as_view(), name="upgrade-to-seller"),
    path("upgrade-status/", views.UpgradeStatusView.as_view(), name="upgrade-status"),
]
