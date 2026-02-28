import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface AnalyticsExportData {
  overview: any
  engagement: any[]
  topCreators: any[]
  growth: any[]
  trending: any[]
  distribution: any
  patterns: any
  sentiment: any
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

// ─── PDF EXPORT ─────────────────────────────────────────────

export function exportAnalyticsPDF(data: AnalyticsExportData): void {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const indigo = [99, 102, 241] as [number, number, number]

  const tableDefaults = {
    theme: 'grid' as const,
    headStyles: { fillColor: indigo, textColor: 255, fontStyle: 'bold' as const, fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] as [number, number, number] },
    alternateRowStyles: { fillColor: [241, 245, 249] as [number, number, number] },
    margin: { left: 14, right: 14 },
  }

  const addSectionHeader = (text: string, y: number): number => {
    doc.setFontSize(14)
    doc.setTextColor(99, 102, 241)
    doc.text(text, 14, y)
    doc.setDrawColor(99, 102, 241)
    doc.line(14, y + 2, pageWidth - 14, y + 2)
    return y + 10
  }

  // ── Page 1: Cover + Overview ──
  doc.setFontSize(26)
  doc.setTextColor(99, 102, 241)
  doc.text('Aurora Social', 14, 30)
  doc.setFontSize(16)
  doc.setTextColor(100, 100, 100)
  doc.text('Analytics Report', 14, 42)
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 52)

  let y = 65

  if (data.overview) {
    y = addSectionHeader('Platform Overview', y)
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Metric', 'Value']],
      body: [
        ['Total Users', data.overview.users.total],
        ['Organic Users', data.overview.users.organic],
        ['Synthetic Users', data.overview.users.synthetic],
        ['Weekly Active Users', data.overview.users.weeklyActive],
        ['Total Posts', data.overview.content.posts],
        ['Total Likes', data.overview.content.likes],
        ['Total Comments', data.overview.content.comments],
        ['Total Reactions', data.overview.content.reactions],
        ['Total Polls', data.overview.content.polls],
        ['Total Groups', data.overview.content.groups],
        ['Engagement Rate', data.overview.engagementRate + ' per post'],
      ],
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (data.distribution) {
    y = addSectionHeader('Content Distribution', y)
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Type', 'Count', 'Percentage']],
      body: [
        ['Text Only', data.distribution.breakdown.textOnly.count, data.distribution.breakdown.textOnly.pct + '%'],
        ['With Media', data.distribution.breakdown.withMedia.count, data.distribution.breakdown.withMedia.pct + '%'],
        ['Polls', data.distribution.breakdown.polls.count, data.distribution.breakdown.polls.pct + '%'],
      ],
    })
    y = (doc as any).lastAutoTable.finalY + 10
  }

  if (data.sentiment) {
    y = addSectionHeader('Sentiment Analysis', y)
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Category', 'Value']],
      body: [
        ['Positive', data.sentiment.distribution.positive],
        ['Negative', data.sentiment.distribution.negative],
        ['Neutral', data.sentiment.distribution.neutral],
        ['Mixed', data.sentiment.distribution.mixed],
        ['Avg Score', data.sentiment.averageScore],
        ['Avg Confidence', data.sentiment.averageConfidence],
        ['Analyzed', data.sentiment.analyzed],
        ['Unanalyzed', data.sentiment.unanalyzed],
      ],
    })
  }

  // ── Page 2: Engagement ──
  if (data.engagement.length > 0) {
    doc.addPage()
    let ey = addSectionHeader('Daily Engagement (Last 30 Days)', 20)
    autoTable(doc, {
      ...tableDefaults,
      startY: ey,
      head: [['Date', 'Posts', 'Likes', 'Comments', 'Reactions', 'Active Users', 'New Users']],
      body: data.engagement.map(e => [e.date, e.posts, e.likes, e.comments, e.reactions, e.activeUsers, e.newUsers]),
    })
  }

  // ── Page 3: User Growth ──
  if (data.growth.length > 0) {
    doc.addPage()
    let gy = addSectionHeader('User Growth (Last 90 Days)', 20)
    autoTable(doc, {
      ...tableDefaults,
      startY: gy,
      head: [['Date', 'New Organic', 'New Synthetic', 'New Total', 'Cumulative']],
      body: data.growth.map(g => [g.date, g.newOrganic, g.newSynthetic, g.newTotal, g.cumulative]),
    })
  }

  // ── Page 4: Top Creators + Trending ──
  doc.addPage()
  let cy = 20

  if (data.topCreators.length > 0) {
    cy = addSectionHeader('Top Creators', cy)
    autoTable(doc, {
      ...tableDefaults,
      startY: cy,
      head: [['Rank', 'Username', 'Posts', 'Comments']],
      body: data.topCreators.map((c, i) => [i + 1, c.username, c.posts, c.comments]),
    })
    cy = (doc as any).lastAutoTable.finalY + 12
  }

  if (data.trending.length > 0) {
    cy = addSectionHeader('Trending Hashtags', cy)
    autoTable(doc, {
      ...tableDefaults,
      startY: cy,
      head: [['Rank', 'Hashtag', 'Post Count', 'Engagement']],
      body: data.trending.map((t, i) => [i + 1, '#' + t.name, t.postCount, t.engagement]),
    })
  }

  // ── Page 5: Posting Patterns ──
  if (data.patterns) {
    doc.addPage()
    let py = addSectionHeader('Posting Patterns — By Hour', 20)
    autoTable(doc, {
      ...tableDefaults,
      startY: py,
      head: [['Hour', 'Posts']],
      body: data.patterns.byHour.map((h: any) => [h.label, h.posts]),
      columnStyles: { 0: { cellWidth: 30 } },
    })
    py = (doc as any).lastAutoTable.finalY + 12

    py = addSectionHeader('Posting Patterns — By Day', py)
    autoTable(doc, {
      ...tableDefaults,
      startY: py,
      head: [['Day', 'Posts']],
      body: data.patterns.byDay.map((d: any) => [d.day, d.posts]),
      columnStyles: { 0: { cellWidth: 40 } },
    })
  }

  doc.save(`aurora-analytics-${dateStamp()}.pdf`)
}

// ─── EXCEL EXPORT ───────────────────────────────────────────

export function exportAnalyticsExcel(data: AnalyticsExportData): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Overview
  if (data.overview) {
    const rows: any[][] = [
      ['Aurora Social Analytics Report'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      ['Metric', 'Value'],
      ['Total Users', data.overview.users.total],
      ['Organic Users', data.overview.users.organic],
      ['Synthetic Users', data.overview.users.synthetic],
      ['Weekly Active Users', data.overview.users.weeklyActive],
      ['Total Posts', data.overview.content.posts],
      ['Total Likes', data.overview.content.likes],
      ['Total Comments', data.overview.content.comments],
      ['Total Reactions', data.overview.content.reactions],
      ['Total Polls', data.overview.content.polls],
      ['Total Groups', data.overview.content.groups],
      ['Engagement Rate', data.overview.engagementRate],
    ]

    if (data.distribution) {
      rows.push([], ['Content Distribution'], ['Type', 'Count', 'Percentage'])
      rows.push(['Text Only', data.distribution.breakdown.textOnly.count, data.distribution.breakdown.textOnly.pct + '%'])
      rows.push(['With Media', data.distribution.breakdown.withMedia.count, data.distribution.breakdown.withMedia.pct + '%'])
      rows.push(['Polls', data.distribution.breakdown.polls.count, data.distribution.breakdown.polls.pct + '%'])
    }

    if (data.sentiment) {
      rows.push([], ['Sentiment Analysis'], ['Category', 'Value'])
      rows.push(['Positive', data.sentiment.distribution.positive])
      rows.push(['Negative', data.sentiment.distribution.negative])
      rows.push(['Neutral', data.sentiment.distribution.neutral])
      rows.push(['Mixed', data.sentiment.distribution.mixed])
      rows.push(['Avg Score', data.sentiment.averageScore])
      rows.push(['Avg Confidence', data.sentiment.averageConfidence])
      rows.push(['Analyzed', data.sentiment.analyzed])
      rows.push(['Unanalyzed', data.sentiment.unanalyzed])
    }

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 22 }, { wch: 15 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Overview')
  }

  // Sheet 2: Engagement
  if (data.engagement.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.engagement.map(e => ({
        Date: e.date,
        Posts: e.posts,
        Likes: e.likes,
        Comments: e.comments,
        Reactions: e.reactions,
        'Active Users': e.activeUsers,
        'New Users': e.newUsers,
      }))
    )
    ws['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 13 }, { wch: 11 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Engagement')
  }

  // Sheet 3: User Growth
  if (data.growth.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.growth.map(g => ({
        Date: g.date,
        'New Organic': g.newOrganic,
        'New Synthetic': g.newSynthetic,
        'New Total': g.newTotal,
        Cumulative: g.cumulative,
      }))
    )
    ws['!cols'] = [{ wch: 12 }, { wch: 13 }, { wch: 14 }, { wch: 11 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'User Growth')
  }

  // Sheet 4: Top Creators
  if (data.topCreators.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.topCreators.map((c, i) => ({
        Rank: i + 1,
        Username: c.username,
        Posts: c.posts,
        Comments: c.comments,
      }))
    )
    ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 8 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Top Creators')
  }

  // Sheet 5: Trending Hashtags
  if (data.trending.length > 0) {
    const ws = XLSX.utils.json_to_sheet(
      data.trending.map((t, i) => ({
        Rank: i + 1,
        Hashtag: '#' + t.name,
        'Post Count': t.postCount,
        Engagement: t.engagement,
      }))
    )
    ws['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Trending Hashtags')
  }

  // Sheet 6: Posting Patterns
  if (data.patterns) {
    const rows: any[][] = [
      ['Posting Patterns — By Hour'],
      ['Hour', 'Posts'],
      ...data.patterns.byHour.map((h: any) => [h.label, h.posts]),
      [],
      ['Posting Patterns — By Day'],
      ['Day', 'Posts'],
      ...data.patterns.byDay.map((d: any) => [d.day, d.posts]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 15 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws, 'Posting Patterns')
  }

  XLSX.writeFile(wb, `aurora-analytics-${dateStamp()}.xlsx`)
}
