import { Loan, Installment, Payment } from '@/types/loan';
import { Customer } from '@/types/customer';
import { formatCurrency, formatDate } from './calculations';
import * as XLSX from 'xlsx';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface CustomerReport {
  customer: Customer;
  totalLent: number;
  totalDue: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  outstanding: number;
  activeLoans: number;
  completedLoans: number;
  overduePayments: number;
  loans: Loan[];
  payments: Payment[];
}

export async function generateCustomerPDF(
  report: CustomerReport,
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        h2 { color: #334155; margin-top: 20px; }
        .header { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #2563eb; }
        .stat-label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
        .stat-value { font-size: 18px; font-weight: bold; color: #0f172a; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #2563eb; color: white; padding: 10px; text-align: left; }
        .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .table tr:hover { background: #f8fafc; }
        .success { color: #16a34a; }
        .error { color: #dc2626; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Customer Financial Report</h1>
        <p><strong>Customer:</strong> ${report.customer.name}</p>
        <p><strong>Phone:</strong> ${report.customer.phone}</p>
        ${report.customer.email ? `<p><strong>Email:</strong> ${report.customer.email}</p>` : ''}
        <p><strong>Report Generated:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Currency:</strong> ${currency.name} (${currency.symbol})</p>
      </div>

      <h2>Financial Summary</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Lent</div>
          <div class="stat-value">${formatCurrency(report.totalLent, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Paid</div>
          <div class="stat-value success">${formatCurrency(report.totalPaid, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Principal Paid</div>
          <div class="stat-value">${formatCurrency(report.principalPaid, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Interest Paid</div>
          <div class="stat-value">${formatCurrency(report.interestPaid, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Outstanding</div>
          <div class="stat-value error">${formatCurrency(report.outstanding, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Active Loans</div>
          <div class="stat-value">${report.activeLoans}</div>
        </div>
      </div>

      <h2>Loan Details</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Loan Date</th>
            <th>Principal</th>
            <th>Interest Rate</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          ${report.loans.map(loan => `
            <tr>
              <td>${formatDate(loan.startDate)}</td>
              <td>${formatCurrency(loan.principalAmount, currency.code, currency.symbol)}</td>
              <td>${loan.interestRate}%</td>
              <td>${loan.status}</td>
              <td>${formatDate(loan.endDate)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Payment History</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          ${report.payments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(payment => `
            <tr>
              <td>${formatDate(payment.paymentDate)}</td>
              <td class="success">${formatCurrency(payment.amount, currency.code, currency.symbol)}</td>
              <td>${formatCurrency(payment.principalAmount, currency.code, currency.symbol)}</td>
              <td>${formatCurrency(payment.interestAmount, currency.code, currency.symbol)}</td>
              <td>${payment.method}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by LendTrack Pro</p>
        <p>For questions or concerns, please contact us.</p>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
}

export async function exportCustomerReportPDF(
  report: CustomerReport,
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const htmlContent = await generateCustomerPDF(report, currency);
  const fileName = `customer_report_${report.customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  
  const file = new File(Paths.document, fileName);
  await file.write(htmlContent);
  
  return file.uri;
}

export async function exportCustomerReportXLSX(
  report: CustomerReport,
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['Customer Financial Report'],
    [''],
    ['Customer Name', report.customer.name],
    ['Phone', report.customer.phone],
    ['Email', report.customer.email || 'N/A'],
    ['Report Date', formatDate(new Date().toISOString())],
    ['Currency', `${currency.name} (${currency.symbol})`],
    [''],
    ['Financial Summary'],
    ['Total Lent', report.totalLent],
    ['Total Paid', report.totalPaid],
    ['Principal Paid', report.principalPaid],
    ['Interest Paid', report.interestPaid],
    ['Outstanding', report.outstanding],
    ['Active Loans', report.activeLoans],
    ['Completed Loans', report.completedLoans],
    ['Overdue Payments', report.overduePayments],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const loanData = [
    ['Loan Date', 'Principal', 'Interest Rate', 'Status', 'Start Date', 'End Date', 'Frequency', 'Installments'],
    ...report.loans.map(loan => [
      formatDate(loan.startDate),
      loan.principalAmount,
      `${loan.interestRate}%`,
      loan.status,
      formatDate(loan.startDate),
      formatDate(loan.endDate),
      loan.installmentFrequency,
      loan.numberOfInstallments,
    ]),
  ];
  const loansSheet = XLSX.utils.aoa_to_sheet(loanData);
  XLSX.utils.book_append_sheet(workbook, loansSheet, 'Loans');

  const paymentData = [
    ['Date', 'Amount', 'Principal', 'Interest', 'Method', 'Notes'],
    ...report.payments
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .map(payment => [
        formatDate(payment.paymentDate),
        payment.amount,
        payment.principalAmount,
        payment.interestAmount,
        payment.method,
        payment.notes || '',
      ]),
  ];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentData);
  XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');

  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const fileName = `customer_report_${report.customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  const file = new File(Paths.document, fileName);
  await file.write(wbout, { encoding: 'base64' });
  
  return file.uri;
}

export async function shareReportViaWhatsApp(
  fileUri: string,
  customerPhone: string,
  message: string = 'Please find your financial report attached.'
): Promise<void> {
  const phoneNumber = customerPhone.replace(/[^0-9]/g, '');
  
  if (Platform.OS === 'web') {
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  } else {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: fileUri.endsWith('.html') ? 'text/html' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Share Report via WhatsApp',
        UTI: fileUri.endsWith('.html') ? 'public.html' : 'org.openxmlformats.spreadsheetml.sheet',
      });
    }
  }
}

export async function exportAllReportsXLSX(
  customerReports: CustomerReport[],
  overallStats: any,
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ['LendTrack Pro - Complete Financial Report'],
    [''],
    ['Report Generated', formatDate(new Date().toISOString())],
    ['Currency', `${currency.name} (${currency.symbol})`],
    [''],
    ['Overall Statistics'],
    ['Total Loans', overallStats.totalLoans],
    ['Total Amount Lent', overallStats.totalLent],
    ['Total Amount Received', overallStats.totalReceived],
    ['Principal Received', overallStats.totalPrincipalReceived],
    ['Interest Earned', overallStats.totalInterest],
    ['Average Loan Size', overallStats.averageLoanSize],
    ['Total Payments', overallStats.totalPayments],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Overall Summary');

  const customerSummaryData = [
    ['Customer', 'Phone', 'Total Lent', 'Total Paid', 'Principal Paid', 'Interest Paid', 'Outstanding', 'Active Loans', 'Overdue Payments'],
    ...customerReports.map(report => [
      report.customer.name,
      report.customer.phone,
      report.totalLent,
      report.totalPaid,
      report.principalPaid,
      report.interestPaid,
      report.outstanding,
      report.activeLoans,
      report.overduePayments,
    ]),
  ];
  const customerSummarySheet = XLSX.utils.aoa_to_sheet(customerSummaryData);
  XLSX.utils.book_append_sheet(workbook, customerSummarySheet, 'Customers Summary');

  customerReports.forEach((report, index) => {
    if (report.loans.length > 0 || report.payments.length > 0) {
      const customerData = [
        [`Customer: ${report.customer.name}`],
        [''],
        ['Loans'],
        ['Date', 'Principal', 'Interest Rate', 'Status', 'Start Date', 'End Date'],
        ...report.loans.map(loan => [
          formatDate(loan.startDate),
          loan.principalAmount,
          `${loan.interestRate}%`,
          loan.status,
          formatDate(loan.startDate),
          formatDate(loan.endDate),
        ]),
        [''],
        ['Payments'],
        ['Date', 'Amount', 'Principal', 'Interest', 'Method'],
        ...report.payments
          .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
          .map(payment => [
            formatDate(payment.paymentDate),
            payment.amount,
            payment.principalAmount,
            payment.interestAmount,
            payment.method,
          ]),
      ];
      const customerSheet = XLSX.utils.aoa_to_sheet(customerData);
      const sheetName = report.customer.name.substring(0, 25).replace(/[\/\\?*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(workbook, customerSheet, sheetName);
    }
  });

  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const fileName = `complete_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  const file = new File(Paths.document, fileName);
  await file.write(wbout, { encoding: 'base64' });
  
  return file.uri;
}
