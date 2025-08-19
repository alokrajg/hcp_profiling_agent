import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List


class Emailer:
	def __init__(self) -> None:
		self.host = os.getenv("SMTP_HOST", "")
		self.port = int(os.getenv("SMTP_PORT", "587"))
		self.username = os.getenv("SMTP_USERNAME", "")
		self.password = os.getenv("SMTP_PASSWORD", "")
		self.email_from = os.getenv("EMAIL_FROM", self.username)

	def send_email(self, to: List[str], subject: str, html: str) -> None:
		if not self.host or not self.username or not self.password:
			raise RuntimeError("SMTP settings are not configured")
		msg = MIMEMultipart("alternative")
		msg["Subject"] = subject
		msg["From"] = self.email_from
		msg["To"] = ", ".join(to)
		msg.attach(MIMEText(html, "html"))

		with smtplib.SMTP(self.host, self.port) as server:
			server.starttls()
			server.login(self.username, self.password)
			server.sendmail(self.email_from, to, msg.as_string())
