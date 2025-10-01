import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { TemplateField } from '../types';

// Import sharp (now required dependency)
import sharp from 'sharp';

export interface TemplateCertificateData {
  templatePath: string;
  templateType: 'image' | 'pdf';
  fields: TemplateField[];
  data: Record<string, string>;
  outputPath: string;
  templateWidth: number;
  templateHeight: number;
  qrCodeData?: string;
}

export class TemplateCertificateGenerator {
  static async generateCertificate(config: TemplateCertificateData): Promise<void> {
    if (config.templateType === 'image') {
      await this.generateFromImage(config);
    } else {
      await this.generateFromPDF(config);
    }
  }

  private static async generateFromImage(config: TemplateCertificateData): Promise<void> {
    try {
      // Read the template image
      const templateBuffer = fs.readFileSync(config.templatePath);

      // Create a base image from the template
      let compositeImage = sharp(templateBuffer);

      // Get image metadata
      const metadata = await compositeImage.metadata();
      const imageWidth = metadata.width || config.templateWidth;
      const imageHeight = metadata.height || config.templateHeight;

      // Create SVG overlays for text fields
      const svgOverlays: string[] = [];

      for (const field of config.fields) {
        const value = config.data[field.name] || '';
        if (!value) continue;

        // Calculate scaled positions based on template dimensions
        const scaleX = imageWidth / config.templateWidth;
        const scaleY = imageHeight / config.templateHeight;

        const scaledX = Math.round(field.x * scaleX);
        const scaledY = Math.round(field.y * scaleY);
        const scaledFontSize = Math.round(field.fontSize * scaleY);

        // Convert hex color to RGB
        const color = this.hexToRgb(field.fontColor);

        // Build text styles
        let fontWeight = field.fontWeight === 'bold' ? 'bold' : 'normal';
        let fontStyle = field.fontStyle === 'italic' ? 'italic' : 'normal';

        // Text anchor based on alignment
        let textAnchor = field.textAlign;
        let textX = scaledX;

        if (field.textAlign === 'center') {
          textX = scaledX + (field.width * scaleX / 2);
        } else if (field.textAlign === 'right') {
          textX = scaledX + (field.width * scaleX);
        }

        const svgText = `
          <svg width="${imageWidth}" height="${imageHeight}">
            <text
              x="${textX}"
              y="${scaledY + scaledFontSize}"
              font-family="${field.fontFamily}"
              font-size="${scaledFontSize}"
              font-weight="${fontWeight}"
              font-style="${fontStyle}"
              fill="rgb(${color.r}, ${color.g}, ${color.b})"
              text-anchor="${textAnchor}"
            >${this.escapeXml(value)}</text>
          </svg>
        `;

        svgOverlays.push(svgText);
      }

      // Composite all text overlays onto the image
      if (svgOverlays.length > 0) {
        const overlays = svgOverlays.map(svg => ({
          input: Buffer.from(svg),
          top: 0,
          left: 0
        }));

        compositeImage = compositeImage.composite(overlays);
      }

      // Convert to PDF
      const imageBuffer = await compositeImage.png().toBuffer();
      const pdfDoc = await PDFDocument.create();

      // Calculate PDF dimensions (convert pixels to points, assuming 72 DPI)
      const pdfWidth = imageWidth * 0.75;
      const pdfHeight = imageHeight * 0.75;

      const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
      const pngImage = await pdfDoc.embedPng(imageBuffer);

      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pdfWidth,
        height: pdfHeight
      });

      // Add QR code if provided
      if (config.qrCodeData) {
        await this.addQRCodeToPDF(pdfDoc, page, config.qrCodeData, pdfWidth, pdfHeight);
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(config.outputPath, pdfBytes);

    } catch (error) {
      console.error('Error generating certificate from image:', error);
      throw error;
    }
  }

  private static async generateFromPDF(config: TemplateCertificateData): Promise<void> {
    try {
      // Read the template PDF
      const templateBuffer = fs.readFileSync(config.templatePath);
      const pdfDoc = await PDFDocument.load(templateBuffer);

      // Get the first page
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width: pageWidth, height: pageHeight } = firstPage.getSize();

      // Embed fonts
      const fontCache: Record<string, any> = {
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        'Times-Roman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'Times-Bold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
        'Courier-Bold': await pdfDoc.embedFont(StandardFonts.CourierBold)
      };

      // Calculate scale factors
      const scaleX = pageWidth / config.templateWidth;
      const scaleY = pageHeight / config.templateHeight;

      // Draw text fields on the PDF
      console.log(`📝 Processing ${config.fields.length} fields for PDF template`);
      for (const field of config.fields) {
        const value = config.data[field.name] || '';
        console.log(`   Field "${field.name}": "${value}" (x:${field.x}, y:${field.y}, fontSize:${field.fontSize})`);

        if (!value) {
          console.log(`   ⚠️  Skipping field "${field.name}" - no value provided`);
          continue;
        }

        // Scale positions and font size
        const scaledX = field.x * scaleX;
        const scaledY = pageHeight - (field.y * scaleY); // PDF coordinates are bottom-up
        const scaledFontSize = field.fontSize * scaleY;

        // Select font based on weight and family
        let fontKey = field.fontFamily;
        if (field.fontWeight === 'bold') {
          if (fontKey.includes('Helvetica')) fontKey = 'Helvetica-Bold';
          else if (fontKey.includes('Times')) fontKey = 'Times-Bold';
          else if (fontKey.includes('Courier')) fontKey = 'Courier-Bold';
        }

        const font = fontCache[fontKey] || fontCache['Helvetica'];

        // Convert hex color to RGB (0-1 range)
        const color = this.hexToRgb(field.fontColor);
        const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255);

        // Calculate text width for alignment
        const textWidth = font.widthOfTextAtSize(value, scaledFontSize);
        let textX = scaledX;

        if (field.textAlign === 'center') {
          textX = scaledX + (field.width * scaleX / 2) - (textWidth / 2);
        } else if (field.textAlign === 'right') {
          textX = scaledX + (field.width * scaleX) - textWidth;
        }

        console.log(`   ✅ Drawing text at (${textX.toFixed(2)}, ${scaledY.toFixed(2)}) with size ${scaledFontSize.toFixed(2)}`);

        // Draw the text
        firstPage.drawText(value, {
          x: textX,
          y: scaledY,
          size: scaledFontSize,
          font: font,
          color: rgbColor
        });
      }

      // Add QR code if provided
      if (config.qrCodeData) {
        await this.addQRCodeToPDF(pdfDoc, firstPage, config.qrCodeData, pageWidth, pageHeight);
      }

      // Save the modified PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(config.outputPath, pdfBytes);

    } catch (error) {
      console.error('Error generating certificate from PDF:', error);
      throw error;
    }
  }

  private static async addQRCodeToPDF(pdfDoc: any, page: any, qrCodeData: string, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrCodeData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Convert data URL to buffer
      const qrCodeImage = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrCodeBuffer = Buffer.from(qrCodeImage, 'base64');

      // Embed QR code in PDF
      const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

      // Position QR code at bottom right
      const qrSize = 60;
      const margin = 30;

      page.drawImage(qrImage, {
        x: pageWidth - qrSize - margin,
        y: margin,
        width: qrSize,
        height: qrSize
      });

      // Add "Scan to verify" text
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 8;
      const text = 'Scan to verify';
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      page.drawText(text, {
        x: pageWidth - qrSize - margin + (qrSize - textWidth) / 2,
        y: margin - 12,
        size: fontSize,
        font: font,
        color: rgb(0.4, 0.4, 0.4)
      });
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
      // Don't throw - QR code is optional
    }
  }

  private static async generateImageAsPDF(config: TemplateCertificateData): Promise<void> {
    try {
      // Read the template image
      const imageBuffer = fs.readFileSync(config.templatePath);

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      // Determine image type and embed
      let image;
      const ext = config.templatePath.toLowerCase();
      if (ext.endsWith('.png')) {
        image = await pdfDoc.embedPng(imageBuffer);
      } else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) {
        image = await pdfDoc.embedJpg(imageBuffer);
      } else {
        throw new Error('Unsupported image format. Use PNG or JPG.');
      }

      // Get image dimensions
      const { width: imgWidth, height: imgHeight } = image.scale(1);

      // Create page with image dimensions (convert to points, 72 DPI)
      const pageWidth = config.templateWidth * 0.75;
      const pageHeight = config.templateHeight * 0.75;

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Draw the image
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight
      });

      // Embed fonts
      const fontCache: Record<string, any> = {
        'Helvetica': await pdfDoc.embedFont(StandardFonts.Helvetica),
        'Helvetica-Bold': await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        'Times-Roman': await pdfDoc.embedFont(StandardFonts.TimesRoman),
        'Times-Bold': await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        'Courier': await pdfDoc.embedFont(StandardFonts.Courier),
        'Courier-Bold': await pdfDoc.embedFont(StandardFonts.CourierBold)
      };

      // Calculate scale factors
      const scaleX = pageWidth / config.templateWidth;
      const scaleY = pageHeight / config.templateHeight;

      // Draw text fields on the PDF
      console.log(`📝 Processing ${config.fields.length} fields for Image->PDF template`);
      for (const field of config.fields) {
        const value = config.data[field.name] || '';
        console.log(`   Field "${field.name}": "${value}" (x:${field.x}, y:${field.y}, fontSize:${field.fontSize})`);

        if (!value) {
          console.log(`   ⚠️  Skipping field "${field.name}" - no value provided`);
          continue;
        }

        // Scale positions and font size
        const scaledX = field.x * scaleX;
        const scaledY = pageHeight - (field.y * scaleY); // PDF coordinates are bottom-up
        const scaledFontSize = field.fontSize * scaleY;

        // Select font based on weight and family
        let fontKey = field.fontFamily;
        if (field.fontWeight === 'bold') {
          if (fontKey.includes('Helvetica')) fontKey = 'Helvetica-Bold';
          else if (fontKey.includes('Times')) fontKey = 'Times-Bold';
          else if (fontKey.includes('Courier')) fontKey = 'Courier-Bold';
        }

        const font = fontCache[fontKey] || fontCache['Helvetica'];

        // Convert hex color to RGB (0-1 range)
        const color = this.hexToRgb(field.fontColor);
        const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255);

        // Calculate text width for alignment
        const textWidth = font.widthOfTextAtSize(value, scaledFontSize);
        let textX = scaledX;

        if (field.textAlign === 'center') {
          textX = scaledX + (field.width * scaleX / 2) - (textWidth / 2);
        } else if (field.textAlign === 'right') {
          textX = scaledX + (field.width * scaleX) - textWidth;
        }

        console.log(`   ✅ Drawing text at (${textX.toFixed(2)}, ${scaledY.toFixed(2)}) with size ${scaledFontSize.toFixed(2)}`);

        // Draw the text
        page.drawText(value, {
          x: textX,
          y: scaledY,
          size: scaledFontSize,
          font: font,
          color: rgbColor
        });
      }

      // Add QR code if provided
      if (config.qrCodeData) {
        await this.addQRCodeToPDF(pdfDoc, page, config.qrCodeData, pageWidth, pageHeight);
      }

      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(config.outputPath, pdfBytes);

      console.log('✅ Image template converted to PDF successfully');
    } catch (error) {
      console.error('Error converting image template to PDF:', error);
      throw error;
    }
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return { r, g, b };
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
