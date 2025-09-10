import PDFDocument from 'pdfkit';
import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, inputs, results } = req.body;
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return res.status(500).json({ error: 'SendGrid API key not configured. Set SENDGRID_API_KEY in env.' });
  }

  sgMail.setApiKey(SENDGRID_API_KEY);

  try {
    // Generate PDF in memory using PDFKit
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);

      const msg = {
        to: email,
        from: 'info@exilex.com',
        cc: 'info@exilex.com',
        subject: 'Your Exilex Closing Costs Estimate',
        text: 'Please find attached your closing costs estimate (PDF).',
        attachments: [
          {
            content: pdfBuffer.toString('base64'),
            filename: 'closing-costs-estimate.pdf',
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      await sgMail.send(msg);
      return res.status(200).json({ ok: true });
    });

    // Header
    doc.rect(0,0,595,80).fill('#111111');
    doc.fillColor('white').fontSize(18).text('Exilex Legal Professional Corporation', 60, 30);
    // Title
    doc.moveDown(3);
    doc.fillColor('black').fontSize(16).text('Closing Costs Estimate', {align: 'left'});
    doc.moveDown(0.5);

    // Summary
    doc.fontSize(11).fillColor('black').text(`Transaction type: ${inputs.txType}`);
    doc.text(`Price: ${Number(inputs.price).toLocaleString('en-CA', {style:'currency', currency:'CAD'})}`);
    doc.text('');
    doc.text('Details:');
    for (const [k,v] of Object.entries(results)) {
      doc.text(`${k}: ${typeof v === 'number' ? Number(v).toLocaleString('en-CA', {style:'currency', currency:'CAD'}) : v}`);
    }

    doc.moveDown(1);
    doc.fontSize(10).fillColor('gray').text('This is an estimate for informational purposes only.');
    doc.end();

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}