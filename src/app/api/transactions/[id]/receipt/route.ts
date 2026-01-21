import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jsPDF } from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get transaction with items and user
    const transaction = await db.transaction.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        user: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Create PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(255, 140, 0); // Orange color
    doc.text('AYAM GEPREK SAMBAL IJO', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Jl. Medan - Banda Aceh, Simpang Camat', 105, 28, { align: 'center' });
    doc.text('Gampong Tijue, Kec. Pidie, Kab. Pidie, 24151', 105, 33, { align: 'center' });
    doc.text('Telp: 085260812758', 105, 38, { align: 'center' });

    // Separator
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // Transaction Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`STRUK PEMESANAN`, 105, 55, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`ID Struk       : ${transaction.receiptId}`, 20, 65);
    doc.text(
      `Tanggal        : ${new Date(transaction.orderDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      20,
      72
    );
    doc.text(`Nama           : ${transaction.userName}`, 20, 79);
    doc.text(`ID User        : ${transaction.userIdNumber}`, 20, 86);
    doc.text(`No HP          : ${transaction.userPhoneNumber}`, 20, 93);

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 98, 190, 98);

    // Items
    let y = 108;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Item Pesanan', 20, y);
    y += 8;

    // Item header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Nama Produk', 20, y);
    doc.text('Harga', 120, y, { align: 'right' });
    doc.text('Subtotal', 170, y, { align: 'right' });
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    transaction.items.forEach((item, index) => {
      // Calculate price per unit after discount
      const finalPrice = item.discount > 0
        ? item.price * (1 - item.discount / 100)
        : item.price;

      // Product name and quantity
      doc.text(`${item.quantity}x ${item.productName}`, 20, y);

      // Price and discount info
      if (item.discount > 0) {
        // Show original price (strikethrough effect with gray color)
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 120, y, { align: 'right' });
        // Show discount percentage
        doc.setTextColor(200, 50, 50);
        doc.text(`-${item.discount}%`, 140, y, { align: 'right' });
        // Show discounted price
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Rp ${Math.round(finalPrice).toLocaleString('id-ID')}`, 170, y, { align: 'right' });
      } else {
        // No discount, just show normal price
        doc.text(`Rp ${item.price.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
      }

      // Subtotal
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
      y += 10;
    });

    // Separator
    y += 3;
    doc.setDrawColor(255, 140, 0);
    doc.line(20, y, 190, y);
    y += 10;

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL HARGA', 20, y);
    doc.text(`Rp ${transaction.totalAmount.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
    y += 10;

    // Status
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const statusText = {
      waiting: 'Menunggu Persetujuan',
      approved: 'Disetujui',
      processing: 'Sedang Diproses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }[transaction.status] || transaction.status;

    doc.text(`Status: ${statusText}`, 20, y);

    // Coins earned
    if (transaction.status === 'completed') {
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 150, 0);
      doc.text(`Koin Diperoleh: +${transaction.coinsEarned}`, 20, y);
    }

    // Footer
    y += 20;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Terima kasih telah memesan di Ayam Geprek Sambal Ijo 🙏', 105, y, { align: 'center' });
    y += 5;
    doc.text('Instagram: @ayamgepreksambalijo | Facebook: Ayam Geprek Sambal Ijo', 105, y, { align: 'center' });

    // Convert to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="struk-${transaction.receiptId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
