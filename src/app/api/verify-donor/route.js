import { prisma } from "../../lib/prisma"; // Adjust this import based on your structure
import { NextResponse } from "next/server";
import emailService from "../../lib/email-service";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const existingToken = await prisma.donorVerificationToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (existingToken.expires < new Date()) {
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Get donor information for email
    const donor = await prisma.donor.findUnique({
      where: { email: existingToken.identifier },
      include: {
        organization: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!donor) {
      return NextResponse.json({ error: "Donor not found" }, { status: 404 });
    }

    // Mark donor as verified (set status true) and delete token in transaction
    await prisma.$transaction(async (tx) => {
      // Update donor status
      await tx.donor.update({
        where: { email: existingToken.identifier },
        data: {
          status: true, // assuming 'status' true means verified
        },
      });

      // Delete token after verification
      await tx.donorVerificationToken.delete({
        where: { token },
      });
    });

    // Send success verification email
    let emailSent = false;
    let emailError = null;

    try {
      if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD) {
        const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.changeworksfund.org'}/donor/dashboard?donor_id=${donor.id}`;
        
        const emailResult = await emailService.sendVerificationSuccessEmail({
          donor: {
            name: donor.name,
            email: donor.email
          },
          organization: donor.organization,
          dashboardLink: dashboardLink
        });

        if (emailResult.success) {
          emailSent = true;
          console.log('✅ Verification success email sent successfully');
        } else {
          emailError = emailResult.error;
          console.error('❌ Verification success email failed:', emailResult.error);
        }
      } else {
        console.log('⚠️ Email server not configured, skipping success email');
        emailError = 'Email server not configured';
      }
    } catch (emailErr) {
      emailError = emailErr.message;
      console.error('❌ Verification success email sending failed:', emailErr.message);
    }

    return NextResponse.json({ 
      message: "Email successfully verified.",
      email_status: {
        success_email_sent: emailSent,
        error: emailError
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
