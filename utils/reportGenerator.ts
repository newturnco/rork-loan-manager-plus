import { Loan, Installment, Payment } from '@/types/loan';
import { Customer } from '@/types/customer';
import { formatCurrency, formatDate } from './calculations';
import * as XLSX from 'xlsx';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Directory } from 'expo-file-system/next';

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
  
  if (Platform.OS === 'web') {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const file = new Directory('cache').getFile(fileName);
    await file.write(htmlContent);
    return file.uri;
  }
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

  const fileName = `customer_report_${report.customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  if (Platform.OS === 'web') {
    const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const file = new Directory('cache').getFile(fileName);
    await file.write(wbout, { encoding: 'base64' });
    return file.uri;
  }
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

  const fileName = `complete_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  if (Platform.OS === 'web') {
    const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const file = new Directory('cache').getFile(fileName);
    await file.write(wbout, { encoding: 'base64' });
    return file.uri;
  }
}

export async function exportAllReportsPDF(
  customerReports: CustomerReport[],
  overallStats: any,
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; margin-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; margin-bottom: 15px; }
        h3 { color: #475569; margin-top: 20px; margin-bottom: 10px; }
        .header { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 6px; border-left: 3px solid #2563eb; }
        .stat-label { font-size: 13px; color: #64748b; margin-bottom: 5px; }
        .stat-value { font-size: 20px; font-weight: bold; color: #0f172a; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
        .table th { background: #2563eb; color: white; padding: 12px; text-align: left; font-size: 14px; }
        .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .table tr:hover { background: #f8fafc; }
        .success { color: #16a34a; }
        .error { color: #dc2626; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LendTrack Pro - Complete Financial Report</h1>
        <p><strong>Report Generated:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Currency:</strong> ${currency.name} (${currency.symbol})</p>
      </div>

      <h2>Overall Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Loans</div>
          <div class="stat-value">${overallStats.totalLoans}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Amount Lent</div>
          <div class="stat-value">${formatCurrency(overallStats.totalLent, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Amount Received</div>
          <div class="stat-value success">${formatCurrency(overallStats.totalReceived, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Principal Received</div>
          <div class="stat-value">${formatCurrency(overallStats.totalPrincipalReceived, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Interest Earned</div>
          <div class="stat-value success">${formatCurrency(overallStats.totalInterest, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Loan Size</div>
          <div class="stat-value">${formatCurrency(overallStats.averageLoanSize, currency.code, currency.symbol)}</div>
        </div>
      </div>

      <h2>Customer Summary</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Phone</th>
            <th>Total Lent</th>
            <th>Total Paid</th>
            <th>Outstanding</th>
            <th>Active Loans</th>
          </tr>
        </thead>
        <tbody>
          ${customerReports.map(report => `
            <tr>
              <td>${report.customer.name}</td>
              <td>${report.customer.phone}</td>
              <td>${formatCurrency(report.totalLent, currency.code, currency.symbol)}</td>
              <td class="success">${formatCurrency(report.totalPaid, currency.code, currency.symbol)}</td>
              <td class="error">${formatCurrency(report.outstanding, currency.code, currency.symbol)}</td>
              <td>${report.activeLoans}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${customerReports.map((report, index) => `
        ${index > 0 ? '<div class="page-break"></div>' : ''}
        <h3>Customer: ${report.customer.name}</h3>
        <p><strong>Phone:</strong> ${report.customer.phone}</p>
        ${report.customer.email ? `<p><strong>Email:</strong> ${report.customer.email}</p>` : ''}
        
        <h4>Loans (${report.loans.length})</h4>
        ${report.loans.length > 0 ? `
          <table class="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Principal</th>
                <th>Interest Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${report.loans.map(loan => `
                <tr>
                  <td>${formatDate(loan.startDate)}</td>
                  <td>${formatCurrency(loan.principalAmount, currency.code, currency.symbol)}</td>
                  <td>${loan.interestRate}%</td>
                  <td>${loan.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p>No loans</p>'}
        
        <h4>Payments (${report.payments.length})</h4>
        ${report.payments.length > 0 ? `
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
        ` : '<p>No payments</p>'}
      `).join('')}

      <div class="footer">
        <p>This report was generated by LendTrack Pro</p>
        <p>For questions or concerns, please contact us.</p>
      </div>
    </body>
    </html>
  `;

  const fileName = `complete_report_${new Date().toISOString().split('T')[0]}.html`;
  
  if (Platform.OS === 'web') {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const file = new Directory('cache').getFile(fileName);
    await file.write(htmlContent);
    return file.uri;
  }
}

export async function exportLoansXLSX(
  loans: Loan[],
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const workbook = XLSX.utils.book_new();

  const loansData = [
    ['LendTrack Pro - Loans Report'],
    [''],
    ['Report Generated', formatDate(new Date().toISOString())],
    ['Currency', `${currency.name} (${currency.symbol})`],
    ['Total Loans', loans.length],
    [''],
    ['Borrower', 'Phone', 'Principal', 'Interest Rate', 'Interest Type', 'Status', 'Start Date', 'End Date', 'Installments', 'Frequency'],
    ...loans.map(loan => [
      loan.borrowerName,
      loan.borrowerPhone,
      loan.principalAmount,
      `${loan.interestRate}%`,
      loan.interestType,
      loan.status,
      formatDate(loan.startDate),
      formatDate(loan.endDate),
      loan.numberOfInstallments,
      loan.installmentFrequency,
    ]),
  ];
  const loansSheet = XLSX.utils.aoa_to_sheet(loansData);
  XLSX.utils.book_append_sheet(workbook, loansSheet, 'Loans');

  const fileName = `loans_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  if (Platform.OS === 'web') {
    const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const file = new Directory('cache').getFile(fileName);
    await file.write(wbout, { encoding: 'base64' });
    return file.uri;
  }
}

export async function exportLoansPDF(
  loans: Loan[],
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
        .header { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #2563eb; color: white; padding: 10px; text-align: left; }
        .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .table tr:hover { background: #f8fafc; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LendTrack Pro - Loans Report</h1>
        <p><strong>Report Generated:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Currency:</strong> ${currency.name} (${currency.symbol})</p>
        <p><strong>Total Loans:</strong> ${loans.length}</p>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Borrower</th>
            <th>Phone</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Status</th>
            <th>Start Date</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          ${loans.map(loan => `
            <tr>
              <td>${loan.borrowerName}</td>
              <td>${loan.borrowerPhone}</td>
              <td>${formatCurrency(loan.principalAmount, currency.code, currency.symbol)}</td>
              <td>${loan.interestRate}% ${loan.interestType}</td>
              <td>${loan.status}</td>
              <td>${formatDate(loan.startDate)}</td>
              <td>${formatDate(loan.endDate)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by LendTrack Pro</p>
      </div>
    </body>
    </html>
  `;

  const fileName = `loans_report_${new Date().toISOString().split('T')[0]}.html`;
  
  if (Platform.OS === 'web') {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const file = new Directory('cache').getFile(fileName);
    await file.write(htmlContent);
    return file.uri;
  }
}

export async function exportPaymentsXLSX(
  payments: Payment[],
  loans: Loan[],
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const workbook = XLSX.utils.book_new();

  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipal = payments.reduce((sum, p) => sum + p.principalAmount, 0);
  const totalInterest = payments.reduce((sum, p) => sum + p.interestAmount, 0);

  const paymentsData = [
    ['LendTrack Pro - Payments Report'],
    [''],
    ['Report Generated', formatDate(new Date().toISOString())],
    ['Currency', `${currency.name} (${currency.symbol})`],
    ['Total Payments', payments.length],
    ['Total Amount', totalAmount],
    ['Total Principal', totalPrincipal],
    ['Total Interest', totalInterest],
    [''],
    ['Date', 'Borrower', 'Amount', 'Principal', 'Interest', 'Method', 'Notes'],
    ...payments
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .map(payment => {
        const loan = loans.find(l => l.id === payment.loanId);
        return [
          formatDate(payment.paymentDate),
          loan?.borrowerName || 'Unknown',
          payment.amount,
          payment.principalAmount,
          payment.interestAmount,
          payment.method,
          payment.notes || '',
        ];
      }),
  ];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments');

  const fileName = `payments_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  if (Platform.OS === 'web') {
    const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const file = new Directory('cache').getFile(fileName);
    await file.write(wbout, { encoding: 'base64' });
    return file.uri;
  }
}

export async function exportPaymentsPDF(
  payments: Payment[],
  loans: Loan[],
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPrincipal = payments.reduce((sum, p) => sum + p.principalAmount, 0);
  const totalInterest = payments.reduce((sum, p) => sum + p.interestAmount, 0);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #2563eb; }
        .header { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
        .stat-card { background: #f8fafc; padding: 12px; border-radius: 6px; }
        .stat-label { font-size: 12px; color: #64748b; }
        .stat-value { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #2563eb; color: white; padding: 10px; text-align: left; }
        .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .table tr:hover { background: #f8fafc; }
        .success { color: #16a34a; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LendTrack Pro - Payments Report</h1>
        <p><strong>Report Generated:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Currency:</strong> ${currency.name} (${currency.symbol})</p>
        <p><strong>Total Payments:</strong> ${payments.length}</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-label">Total Amount</div>
          <div class="stat-value success">${formatCurrency(totalAmount, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Principal</div>
          <div class="stat-value">${formatCurrency(totalPrincipal, currency.code, currency.symbol)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Interest</div>
          <div class="stat-value success">${formatCurrency(totalInterest, currency.code, currency.symbol)}</div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Borrower</th>
            <th>Amount</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          ${payments
            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
            .map(payment => {
              const loan = loans.find(l => l.id === payment.loanId);
              return `
                <tr>
                  <td>${formatDate(payment.paymentDate)}</td>
                  <td>${loan?.borrowerName || 'Unknown'}</td>
                  <td class="success">${formatCurrency(payment.amount, currency.code, currency.symbol)}</td>
                  <td>${formatCurrency(payment.principalAmount, currency.code, currency.symbol)}</td>
                  <td class="success">${formatCurrency(payment.interestAmount, currency.code, currency.symbol)}</td>
                  <td>${payment.method}</td>
                </tr>
              `;
            }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by LendTrack Pro</p>
      </div>
    </body>
    </html>
  `;

  const fileName = `payments_report_${new Date().toISOString().split('T')[0]}.html`;
  
  if (Platform.OS === 'web') {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const file = new Directory('cache').getFile(fileName);
    await file.write(htmlContent);
    return file.uri;
  }
}

export async function exportCustomersXLSX(
  customers: Customer[],
  loans: Loan[],
  currency: { code: string; symbol: string; name: string }
): Promise<string> {
  const workbook = XLSX.utils.book_new();

  const customersData = [
    ['LendTrack Pro - Customers Report'],
    [''],
    ['Report Generated', formatDate(new Date().toISOString())],
    ['Total Customers', customers.length],
    [''],
    ['Name', 'Phone', 'Email', 'Active Loans', 'Total Loans', 'Created Date'],
    ...customers.map(customer => {
      const customerLoans = loans.filter(l => l.customerId === customer.id);
      const activeLoans = customerLoans.filter(l => l.status === 'active');
      return [
        customer.name,
        customer.phone,
        customer.email || 'N/A',
        activeLoans.length,
        customerLoans.length,
        formatDate(customer.createdAt),
      ];
    }),
  ];
  const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
  XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');

  const fileName = `customers_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  if (Platform.OS === 'web') {
    const wbout = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const file = new Directory('cache').getFile(fileName);
    await file.write(wbout, { encoding: 'base64' });
    return file.uri;
  }
}

export async function exportCustomersPDF(
  customers: Customer[],
  loans: Loan[],
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
        .header { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .table th { background: #2563eb; color: white; padding: 10px; text-align: left; }
        .table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .table tr:hover { background: #f8fafc; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>LendTrack Pro - Customers Report</h1>
        <p><strong>Report Generated:</strong> ${formatDate(new Date().toISOString())}</p>
        <p><strong>Total Customers:</strong> ${customers.length}</p>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Active Loans</th>
            <th>Total Loans</th>
            <th>Created Date</th>
          </tr>
        </thead>
        <tbody>
          ${customers.map(customer => {
            const customerLoans = loans.filter(l => l.customerId === customer.id);
            const activeLoans = customerLoans.filter(l => l.status === 'active');
            return `
              <tr>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || 'N/A'}</td>
                <td>${activeLoans.length}</td>
                <td>${customerLoans.length}</td>
                <td>${formatDate(customer.createdAt)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by LendTrack Pro</p>
      </div>
    </body>
    </html>
  `;

  const fileName = `customers_report_${new Date().toISOString().split('T')[0]}.html`;
  
  if (Platform.OS === 'web') {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return url;
  } else {
    const file = new Directory('cache').getFile(fileName);
    await file.write(htmlContent);
    return file.uri;
  }
}
