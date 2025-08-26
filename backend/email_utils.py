import smtplib
import os
import pandas as pd
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication


class EmailerAgent:
    def __init__(self, sender_email: str, app_password: str = None,
                 smtp_server="smtp.gmail.com", smtp_port=465):
        self.sender_email = sender_email
        self.app_password = app_password or os.getenv("GMAIL_APP_PASSWORD")
        self.smtp_server = smtp_server
        self.smtp_port = smtp_port

        if not self.app_password:
            raise ValueError("App password missing. Set GMAIL_APP_PASSWORD env variable.")

    def load_recipients(self, excel_file: str, email_col="Email", name_col="Name") -> dict:
        """Load recipients from Excel into {email: name} dict"""
        df = pd.read_excel(excel_file)
        return dict(zip(df[email_col], df[name_col]))

    def generate_report(self, data, filename="HCP_Report.csv"):
        """Save data (list of dicts or DataFrame) to CSV"""
        if isinstance(data, pd.DataFrame):
            df = data
        else:
            df = pd.DataFrame(data)
        df.to_csv(filename, index=False)
        return filename

    def send_emails(self, recipients: dict, report_file: str,
                    subject="Agentic AI Powered HCP Profiling Report"):
        """Send personalized emails with attached report"""
        with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
            server.login(self.sender_email, self.app_password)

            for receiver, name in recipients.items():
                # --------- Email Body (Plain + HTML) ---------
                text_body = f"""
Hi {name},

As part of our ongoing initiative to strengthen stakeholder engagement and deliver actionable healthcare insights, we are excited to share the latest Healthcare Professional (HCP) Profiling Report generated through our Agentic AI-powered data platform.

This report consolidates structured and verified information on HCPs across multiple public data sources, enabling faster and smarter decision-making for Medical Affairs, Commercial, and Business Development teams.

What's Inside the Report:
- Structured profiles of HCPs, including roles, affiliations, education, and areas of expertise
- AI-generated summaries for quick interpretation and decision support
- Social and professional presence mapped for stakeholder visibility
- Compliance-friendly data extraction aligned with industry standards
- Ready-to-use insights for improved targeting, engagement, and collaboration

Why This Matters:
Our goal is to automate manual profiling, save valuable time for business teams, and enable data-driven strategies that are both efficient and compliant. This initiative represents an important step in leveraging AI to bring clarity, consistency, and transparency into healthcare engagement.

Next Steps:
Please find attached the latest HCP Profiling Report for your reference.

We value your partnership and look forward to your feedback.

Best regards,
Team Debug Thugs
"""

                html_body = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
    <p>Hi {name},</p>

    <p>As part of our ongoing initiative to strengthen stakeholder engagement and deliver actionable healthcare insights, 
    we are excited to share the latest <b>Healthcare Professional (HCP) Profiling Report</b> generated through our 
    Agentic AI-powered data platform.</p>

    <p>This report consolidates structured and verified information on HCPs across multiple public data sources, 
    enabling faster and smarter decision-making for Medical Affairs, Commercial, and Business Development teams.</p>

    <h3>🔍 What’s Inside the Report:</h3>
    <ul>
      <li>Structured profiles of HCPs, including roles, affiliations, education, and areas of expertise</li>
      <li>AI-generated summaries for quick interpretation and decision support</li>
      <li>Social and professional presence mapped for stakeholder visibility</li>
      <li>Compliance-friendly data extraction aligned with industry standards</li>
      <li>Ready-to-use insights for improved targeting, engagement, and collaboration</li>
    </ul>

    <h3>💡 Why This Matters:</h3>
    <p>
      Our goal is to <b>automate manual profiling</b>, save valuable time for business teams, 
      and enable <b>data-driven strategies</b> that are efficient, compliant, and future-ready. 
      This initiative represents an important step in leveraging AI to bring clarity, consistency, 
      and transparency into healthcare engagement.
    </p>

    <p>Please find attached the latest <b>HCP Profiling Report</b> for your reference.</p>

    <p>We truly value your partnership and look forward to your feedback, which will help us improve and tailor these insights further.</p>

    <p style="margin-top:20px;">Best regards,<br>
    <b>Team Debug Thugs</b></p>
  </body>
</html>
"""

                # Construct email
                msg = MIMEMultipart("mixed")
                msg["Subject"] = subject
                msg["From"] = self.sender_email
                msg["To"] = receiver

                alt_part = MIMEMultipart("alternative")
                alt_part.attach(MIMEText(text_body, "plain"))
                alt_part.attach(MIMEText(html_body, "html"))
                msg.attach(alt_part)

                # Attach report
                with open(report_file, "rb") as f:
                    attach = MIMEApplication(f.read(), _subtype="csv")
                    attach.add_header("Content-Disposition", "attachment", filename=report_file)
                    msg.attach(attach)

                server.sendmail(self.sender_email, receiver, msg.as_string())
                print(f"✅ Sent email to {name} <{receiver}>")


# ---------------- Example Usage ----------------
if __name__ == "__main__":
    agent = EmailerAgent(sender_email="minklethetwinkle@gmail.com",
                         app_password="ervr zcku cavl eazw")

    # Load recipients from Excel
    recipients = agent.load_recipients("recipients.xlsx")

    # Generate report (could come from DB, API, or scraper)
    data = [
        {"Name": "Dr. John Doe", "Specialty": "Cardiology", "Location": "New York"},
        {"Name": "Dr. Jane Smith", "Specialty": "Dermatology", "Location": "Delhi"},
    ]
    report_file = agent.generate_report(data)

    # Send personalized emails
    agent.send_emails(recipients, report_file)
