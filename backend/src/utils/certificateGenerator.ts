import PDFKit from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

export interface CertificateData {
  studentName: string;
  courseName: string;
  issueDate: string;
  certificateNumber: string;
  verificationUrl: string;
}

export class CertificateGenerator {
  private static readonly CERTIFICATE_WIDTH = 842; // A4 landscape width
  private static readonly CERTIFICATE_HEIGHT = 595; // A4 landscape height

  static async generateCertificate(
    data: CertificateData,
    outputPath: string
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFKit({
          size: [this.CERTIFICATE_WIDTH, this.CERTIFICATE_HEIGHT],
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add elegant border
        doc
          .lineWidth(3)
          .strokeColor("#2C5F2D")
          .rect(
            30,
            30,
            this.CERTIFICATE_WIDTH - 60,
            this.CERTIFICATE_HEIGHT - 60
          )
          .stroke();

        doc
          .lineWidth(1)
          .strokeColor("#97BC62")
          .rect(
            40,
            40,
            this.CERTIFICATE_WIDTH - 80,
            this.CERTIFICATE_HEIGHT - 80
          )
          .stroke();

        // Header decorative element
        doc
          .fillColor("#2C5F2D")
          .circle(this.CERTIFICATE_WIDTH / 2, 100, 25)
          .fill();

        // Certificate title
        doc
          .fontSize(36)
          .fillColor("#2C5F2D")
          .font("Helvetica-Bold")
          .text("CERTIFICATE OF COMPLETION", 0, 140, {
            align: "center",
            width: this.CERTIFICATE_WIDTH,
          });

        // Decorative line
        doc
          .moveTo(200, 190)
          .lineTo(this.CERTIFICATE_WIDTH - 200, 190)
          .lineWidth(2)
          .strokeColor("#97BC62")
          .stroke();

        // "This is to certify that" text
        doc
          .fontSize(16)
          .fillColor("#666666")
          .font("Helvetica")
          .text("This is to certify that", 0, 220, {
            align: "center",
            width: this.CERTIFICATE_WIDTH,
          });

        // Student name
        doc
          .fontSize(32)
          .fillColor("#2C5F2D")
          .font("Helvetica-Bold")
          .text(data.studentName, 0, 260, {
            align: "center",
            width: this.CERTIFICATE_WIDTH,
          });

        // Underline for name
        const nameWidth = doc.widthOfString(data.studentName);
        const nameX = (this.CERTIFICATE_WIDTH - nameWidth) / 2;
        doc
          .moveTo(nameX, 300)
          .lineTo(nameX + nameWidth, 300)
          .lineWidth(1)
          .strokeColor("#97BC62")
          .stroke();

        // "has successfully completed" text
        doc
          .fontSize(16)
          .fillColor("#666666")
          .font("Helvetica")
          .text("has successfully completed the course", 0, 320, {
            align: "center",
            width: this.CERTIFICATE_WIDTH,
          });

        // Course name
        doc
          .fontSize(24)
          .fillColor("#2C5F2D")
          .font("Helvetica-Bold")
          .text(data.courseName, 0, 355, {
            align: "center",
            width: this.CERTIFICATE_WIDTH,
          });

        // Date and certificate number section
        const leftColumnX = 150;
        const rightColumnX = this.CERTIFICATE_WIDTH - 250;
        const bottomY = 450;

        // Issue date
        doc
          .fontSize(12)
          .fillColor("#666666")
          .font("Helvetica")
          .text("Date of Issue:", leftColumnX, bottomY);

        doc
          .fontSize(14)
          .fillColor("#2C5F2D")
          .font("Helvetica-Bold")
          .text(data.issueDate, leftColumnX, bottomY + 15);

        // Certificate number
        doc
          .fontSize(12)
          .fillColor("#666666")
          .font("Helvetica")
          .text("Certificate No:", rightColumnX, bottomY);

        doc
          .fontSize(14)
          .fillColor("#2C5F2D")
          .font("Helvetica-Bold")
          .text(data.certificateNumber, rightColumnX, bottomY + 15);

        // Generate QR code
        const qrCodeData = await QRCode.toDataURL(data.verificationUrl, {
          width: 80,
          color: {
            dark: "#2C5F2D",
            light: "#FFFFFF",
          },
        });

        // Add QR code to PDF
        const qrCodeImage = qrCodeData.replace(/^data:image\/png;base64,/, "");
        const qrCodeBuffer = Buffer.from(qrCodeImage, "base64");

        doc.image(qrCodeBuffer, this.CERTIFICATE_WIDTH - 130, bottomY - 30, {
          width: 80,
          height: 80,
        });

        // QR code label
        doc
          .fontSize(10)
          .fillColor("#666666")
          .font("Helvetica")
          .text("Scan to verify", this.CERTIFICATE_WIDTH - 130, bottomY + 55, {
            width: 80,
            align: "center",
          });

        // Signature line
        doc
          .moveTo(leftColumnX, bottomY + 50)
          .lineTo(leftColumnX + 150, bottomY + 50)
          .lineWidth(1)
          .strokeColor("#2C5F2D")
          .stroke();

        doc
          .fontSize(12)
          .fillColor("#666666")
          .font("Helvetica")
          .text("Authorized Signature", leftColumnX, bottomY + 60);

        // Footer
        doc
          .fontSize(10)
          .fillColor("#999999")
          .font("Helvetica")
          .text(
            "This certificate can be verified online using the QR code or by visiting our website.",
            0,
            this.CERTIFICATE_HEIGHT - 80,
            {
              align: "center",
              width: this.CERTIFICATE_WIDTH,
            }
          );

        doc.end();

        stream.on("finish", () => {
          resolve();
        });

        stream.on("error", (err) => {
          reject(err);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static generateCertificateNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${year}${month}-${random}`;
  }
}
