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

    // ============================================================
    // HEADER - NAMA TOKO (HURUF CAPITAL DI TENGAH)
    // ============================================================
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 140, 0); // Orange color
    doc.text('AYAM GEPREK SAMBAL IJO', 105, 25, { align: 'center' });

    // Separator line
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(1);
    doc.line(20, 32, 190, 32);

    // ============================================================
    // ALAMAT TOKO
    // ============================================================
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Jl. Medan - Banda Aceh, Simpang Camat', 105, 40, { align: 'center' });
    doc.text('Gampong Tijue, Kec. Pidie, Kab. Pidie, 24151', 105, 46, { align: 'center' });
    doc.text('Telp: 085260812758', 105, 52, { align: 'center' });

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 58, 190, 58);

    // ============================================================
    // INFORMASI TRANSAKSI
    // ============================================================
    let y = 70;

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INFORMASI TRANSAKSI', 20, y);
    y += 10;

    // Tanggal & Waktu
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const orderDateTime = transaction.orderDate ? new Date(transaction.orderDate) : null;
    const dateStr = orderDateTime ? orderDateTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }) : 'N/A';
    const timeStr = orderDateTime ? orderDateTime.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) : 'N/A';

    doc.text('Tanggal        : ' + dateStr, 20, y);
    y += 7;
    doc.text('Waktu          : ' + timeStr, 20, y);
    y += 7;
    doc.text('ID Struk       : ' + (transaction.receiptId || 'N/A'), 20, y);
    y += 10;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 10;

    // INFORMASI PELANGGAN
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INFORMASI PELANGGAN', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Nama           : ' + (transaction.userName || 'N/A'), 20, y);
    y += 7;
    doc.text('No HP          : ' + (transaction.userPhoneNumber || 'N/A'), 20, y);
    y += 7;
    doc.text('ID User        : ' + (transaction.userIdNumber || 'N/A'), 20, y);
    y += 10;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 10;

    // ============================================================
    // PRODUK PESANAN
    // ============================================================
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PRODUK PESANAN', 20, y);
    y += 10;

    // Table header
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('No', 20, y);
    doc.text('Nama Produk', 30, y);
    doc.text('Qty', 120, y);
    doc.text('Harga', 140, y);
    doc.text('Diskon', 165, y);
    doc.text('Subtotal', 190, y, { align: 'right' });
    y += 7;

    // Header separator
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Items
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    transaction.items.forEach((item, index) => {
      console.log('[RECEIPT] Processing item:', {
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        subtotal: item.subtotal,
      });

      const itemPrice = item.price || 0;
      const itemDiscount = item.discount || 0;
      const itemSubtotal = item.subtotal || 0;

      const finalPrice = itemDiscount > 0
        ? itemPrice * (1 - itemDiscount / 100)
        : itemPrice;

      // No
      doc.text(`${index + 1}.`, 20, y);

      // Nama Produk
      const nameText = `${item.quantity}x ${item.productName || 'Unknown Product'}`;
      const truncatedName = nameText.length > 35 ? nameText.substring(0, 35) + '...' : nameText;
      doc.text(truncatedName, 30, y);

      // Harga
      if (itemDiscount > 0) {
        doc.setTextColor(150, 150, 150);
        doc.text(`Rp ${itemPrice.toLocaleString('id-ID')}`, 140, y, { align: 'right' });
        doc.setTextColor(200, 50, 50);
        doc.text(`-${itemDiscount}%`, 165, y, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.text(`Rp ${Math.round(finalPrice).toLocaleString('id-ID')}`, 190, y, { align: 'right' });
      } else {
        doc.text(`Rp ${itemPrice.toLocaleString('id-ID')}`, 190, y, { align: 'right' });
      }

      // Subtotal di baris baru
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Subtotal: Rp ${itemSubtotal.toLocaleString('id-ID')}`, 190, y, { align: 'right' });

      // Reset font untuk item berikutnya
      y += 10;
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
    });

    // Footer separator
    y += 5;
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);
    y += 10;

    // ============================================================
    // TOTAL
    // ============================================================
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TOTAL HARGA', 20, y);
    y += 10;

    doc.setFontSize(18);
    doc.setTextColor(255, 140, 0); // Orange
    doc.text(`Rp ${(transaction.totalAmount || 0).toLocaleString('id-ID')}`, 190, y, { align: 'right' });
    y += 15;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 10;

    // Status
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const statusText = {
      waiting: 'Menunggu Persetujuan',
      approved: 'Disetujui',
      processing: 'Sedang Diproses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }[transaction.status] || transaction.status || 'Unknown';

    const statusColor = {
      waiting: [200, 150, 50],
      approved: [50, 150, 200],
      processing: [150, 100, 50],
      completed: [0, 150, 50],
      cancelled: [200, 50, 50],
    }[transaction.status] || [0, 0, 0];

    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`Status: ${statusText}`, 20, y);
    y += 10;

    // Coins earned
    if (transaction.status === 'completed' && transaction.coinsEarned) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 150, 0); // Green
      doc.text(`Koin Diperoleh: +${transaction.coinsEarned}`, 20, y);
      y += 15;
    }

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 20;

    // ============================================================
    // FOOTER - UCAPAN TERIMA KASIH
    // ============================================================
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Terima kasih telah memesan di', 105, y, { align: 'center' });
    y += 6;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 140, 0); // Orange
    doc.text('AYAM GEPREK SAMBAL IJO', 105, y, { align: 'center' });
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Simpan struk ini sebagai bukti pembayaran yang sah', 105, y, { align: 'center' });
    y += 6;

    doc.text('Instagram: @ayamgepreksambalijo', 105, y, { align: 'center' });
    y += 5;
    doc.text('Facebook: Ayam Geprek Sambal Ijo', 105, y, { align: 'center' });
    y += 5;

    doc.text('Hubungi kami jika ada pertanyaan', 105, y, { align: 'center' });
    y += 5;

    // Final separator
    doc.setDrawColor(255, 140, 0);
    doc.setLineWidth(1);
    doc.line(20, y, 190, y);

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
