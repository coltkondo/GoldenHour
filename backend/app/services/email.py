import resend
from app.core.config import settings


def send_password_reset_email(to_email: str, code: str) -> None:
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = settings.RESEND_API_KEY

    resend.Emails.send({
        "from": settings.FROM_EMAIL,
        "to": [to_email],
        "subject": "Golden Hour — your password reset code",
        "html": f"""
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
  <h2 style="margin:0 0 8px;color:#111">Reset your password</h2>
  <p style="color:#555;margin:0 0 24px">Enter this code in the Golden Hour app. It expires in 15 minutes.</p>
  <div style="font-size:36px;font-weight:700;letter-spacing:12px;text-align:center;
              padding:24px;background:#f5f5f5;border-radius:12px;color:#111">{code}</div>
  <p style="color:#999;font-size:12px;margin-top:24px">
    If you didn't request a password reset, you can safely ignore this email.
  </p>
</div>
""",
    })
