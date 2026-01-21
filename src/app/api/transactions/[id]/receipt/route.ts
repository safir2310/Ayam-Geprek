import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jsPDF } from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[RECEIPT] Generating receipt for transaction ID:', params.id);

    // Get transaction with items and user
    const transaction = await db.transaction.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        user: true,
      },
    });

    console.log('[RECEIPT] Transaction found:', !!transaction);

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    console.log('[RECEIPT] Transaction data:', {
      receiptId: transaction.receiptId,
      totalAmount: transaction.totalAmount,
      itemCount: transaction.items.length,
    });

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
    doc.text(`ID Struk       : ${transaction.receiptId || 'N/A'}`, 20, 65);
    doc.text(
      `Tanggal        : ${transaction.orderDate ? new Date(transaction.orderDate).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) : 'N/A'}`,
      20,
      72
    );
    doc.text(`Nama           : ${transaction.userName || 'N/A'}`, 20, 79);
    doc.text(`ID User        : ${transaction.userIdNumber || 'N/A'}`, 20, 86);
    doc.text(`No HP          : ${transaction.userPhoneNumber || 'N/A'}`, 20, 93);

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
      console.log('[RECEIPT] Processing item:', {
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        subtotal: item.subtotal,
      });

      // Calculate price per unit after discount
      const itemPrice = item.price || 0;
      const itemDiscount = item.discount || 0;
      const itemSubtotal = item.subtotal || 0;

      const finalPrice = itemDiscount > 0
        ? itemPrice * (1 - itemDiscount / 100)
        : itemPrice;

      // Product name and quantity
      doc.text(`${item.quantity}x ${item.productName || 'Unknown Product'}`, 20, y);

      // Price and discount info
      if (itemDiscount > 0) {
        // Show original price (strikethrough effect with gray color)
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.text(`Rp ${itemPrice.toLocaleString('id-ID')}`, 120, y, { align: 'right' });
        // Show discount percentage
        doc.setTextColor(200, 50, 50);
        doc.text(`-${itemDiscount}%`, 140, y, { align: 'right' });
        // Show discounted price
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Rp ${Math.round(finalPrice).toLocaleString('id-ID')}`, 170, y, { align: 'right' });
      } else {
        // No discount, just show normal price
        doc.text(`Rp ${itemPrice.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
      }

      // Subtotal
      y += 7;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Subtotal: Rp ${itemSubtotal.toLocaleString('id-ID')}`, 170, y, { align: 'right' });
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
    doc.text(`Rp ${(transaction.totalAmount || 0).toLocaleString('id-ID')}`, 170, y, { align: 'right' });
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
    }[transaction.status] || transaction.status || 'Unknown';

    doc.text(`Status: ${statusText}`, 20, y);

    // Coins earned
    if (transaction.status === 'completed' && transaction.coinsEarned) {
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

    console.log('[RECEIPT] PDF generated successfully, size:', pdfBuffer.length);

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="struk-${transaction.receiptId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[RECEIPT] Error generating PDF:', error);
    console.error('[RECEIPT] Error details:', JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      console.error('[RECEIPT] Error name:', error.name);
      console.error('[RECEIPT] Error message:', error.message);
      console.error('[RECEIPT] Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
