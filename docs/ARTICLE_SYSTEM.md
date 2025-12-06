# Article System - Lawyer-Authored Content

## Overview

The Wakili Pro article system creates a content marketing loop that benefits both users and lawyers:
- **Users** get free, high-quality legal information
- **Lawyers** gain profile exposure and credibility through published articles
- **Platform** establishes authority, improves SEO, and increases engagement

## Current Articles

### 1. Data Protection Regulations in Kenya
- **Author**: Lucy Wanjiku (Corporate Law)
- **Category**: Corporate Law  
- **Length**: ~2,000 words
- **Topics**: ODPC compliance, consent requirements, penalties, practical steps
- **Target Audience**: Business owners, HR managers, tech startups

### 2. Employment Contracts in Kenya
- **Author**: James Mwangi (Employment Law)
- **Category**: Employment Law
- **Length**: ~1,800 words
- **Topics**: Statutory requirements, termination, probation, leave entitlements
- **Target Audience**: Employers, HR professionals, employees

### 3. Land Ownership Rights in Kenya
- **Author**: Grace Njeri (Property Law)
- **Category**: Property Law
- **Length**: ~2,200 words
- **Topics**: Title searches, conveyancing, scams to avoid, Land Control Board
- **Target Audience**: Property buyers, investors, first-time land purchasers

## Article Structure

Each article follows a professional format:

```markdown
<!--METADATA:{"category":"...","tags":[...],"aiSummary":"...","qualityScore":90+}-->

<h2>Introduction</h2>
[Personal introduction from lawyer, establishing expertise]

<h2>Main Content Sections</h2>
[Comprehensive legal guidance with practical examples]

<h2>Practical Checklists/Steps</h2>
[Actionable items readers can implement]

<h2>Common Mistakes to Avoid</h2>
[Real-world pitfalls and how to prevent them]

<h2>Conclusion</h2>
[Summary and call-to-action to book consultation]

<hr>
<p><strong>About the Author:</strong> [Lawyer bio and specialization]</p>
```

## How It Works

### For Users:
1. Visit `/resources` page
2. Browse articles by category (Corporate, Employment, Property, etc.)
3. Click article to read full content
4. See author name with clickable link to lawyer profile
5. Book consultation if they need personalized help

### For Lawyers:
1. Articles are attributed to lawyer's profile (authorId)
2. "By [Lawyer Name]" link appears on article card
3. Clicking name navigates to `/lawyers/:id` profile page
4. Establishes expertise and drives profile traffic
5. Increases booking likelihood from readers

### For Platform:
1. High-quality content improves SEO rankings
2. Free resources attract organic traffic
3. Establishes platform as legal information authority
4. Content marketing reduces customer acquisition cost
5. Lawyer retention through added value

## Technical Implementation

### Database Schema
```typescript
model Article {
  id           String    @id
  authorId     String    // Links to User.id
  title        String
  content      String    // Full HTML article
  isPremium    Boolean   @default(false)
  isPublished  Boolean   @default(false)
  User         User      @relation(fields: [authorId], references: [id])
}
```

### Frontend Display (ResourcesPage.tsx)
```typescript
// Fetch articles with author info
const response = await axiosInstance.get('/articles/published?limit=6');

// Display includes:
- Category badge
- Article title
- AI summary (150 chars)
- Read time calculation
- Author name with link: "By Lucy Wanjiku"
- "Read More" button
```

### Backend API (/api/articles/published)
```typescript
// Includes User relation automatically
include: {
  User: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
}
```

## Adding New Articles

### Option 1: Seed Script
```bash
cd backend
npm run seed:articles
```

### Option 2: Manual Database Insert
```typescript
await prisma.article.create({
  data: {
    id: 'art-unique-id',
    authorId: 'user-lawyer-id',
    title: 'Article Title',
    content: `<!--METADATA:{...}--><h2>Content</h2>...`,
    isPublished: true,
    isPremium: false
  }
});
```

### Option 3: Admin Panel (Future)
Create backend endpoint `/api/articles` (POST) with admin auth:
- Upload article content
- Select author from lawyer dropdown
- Add metadata (category, tags, summary)
- Publish or save as draft

## Content Guidelines

### Writing Standards
- **Length**: 1,500 - 2,500 words for comprehensive coverage
- **Tone**: Professional but accessible, avoid legalese
- **Structure**: Clear headings, short paragraphs, bullet points
- **Examples**: Include real Kenyan law examples and case scenarios
- **Actionable**: Provide checklists, step-by-step guides, templates

### SEO Optimization
- **Title**: Include main keyword (e.g., "Employment Contracts in Kenya")
- **Summary**: 150-160 characters for meta description
- **Headings**: Use H2/H3 tags with relevant keywords
- **Links**: Internal links to related articles, external to authoritative sources
- **Images**: Add relevant images with alt text (future enhancement)

### Legal Accuracy
- **Cite Sources**: Reference specific Acts and sections
- **Current Law**: Update articles when legislation changes
- **Disclaimers**: Include "This is general information, not legal advice"
- **Author Expertise**: Only assign articles matching lawyer specialization

## Article Categories

Current categories (matching lawyer specializations):
- Corporate Law
- Property Law
- Employment Law
- Family Law
- Criminal Law
- Constitutional Law
- Commercial Law
- Tax Law

## Metadata Format

Every article includes metadata in HTML comment at top:
```json
{
  "category": "Corporate Law",
  "tags": ["Data Protection", "Privacy", "Compliance"],
  "aiSummary": "150-character summary for card display",
  "qualityScore": 95,
  "source": "lawyer",
  "readTime": "12 min read"
}
```

## Future Enhancements

### Short Term
1. **Article Detail Page**: Create `/resources/article/:id` with full article view
2. **Related Articles**: Show 3 related articles at bottom
3. **Author Bio Section**: Include lawyer photo, rating, specializations
4. **Book Consultation CTA**: Prominent button linking to booking page

### Medium Term
1. **Article Search**: Filter by category, tags, author
2. **Premium Articles**: Paywall for advanced content
3. **Article Comments**: Allow user questions, lawyer responses
4. **Social Sharing**: Share buttons for Twitter, LinkedIn, WhatsApp

### Long Term
1. **Video Articles**: Embed lawyer explainer videos
2. **Article Series**: Multi-part guides on complex topics
3. **Interactive Tools**: Calculators, document generators
4. **Guest Authors**: Feature partner law firms
5. **Translated Articles**: Swahili versions for wider reach

## Metrics to Track

### Engagement
- Article views
- Read time (how far users scroll)
- Click-through rate to lawyer profile
- Consultation bookings from article readers

### SEO Performance
- Organic search traffic
- Keyword rankings
- Backlinks to articles
- Time on page

### Lawyer Value
- Profile visits from articles
- Consultation requests per article
- Lawyer satisfaction with exposure
- Retention rate of lawyers with published articles

## Seeded Lawyers

The seed script creates 3 lawyer users:

| Name | Email | Specialization | Password |
|------|-------|----------------|----------|
| Lucy Wanjiku | lucy@wakilipro.com | Corporate Law | Password123! |
| James Mwangi | james@wakilipro.com | Employment Law | Password123! |
| Grace Njeri | grace@wakilipro.com | Property Law | Password123! |

These can be used to test the article system and lawyer profile linking.

## Navigation Flow

```
Landing Page
    ↓
Resources Page (/resources)
    ↓
Click Article → Article Detail Page (future)
    ↓
Click "By [Lawyer]" → Lawyer Profile (/lawyers/:id)
    ↓
Book Consultation → Payment → Confirmed Booking
```

## Success Indicators

✅ Articles appear on `/resources` page  
✅ Author names link to lawyer profiles  
✅ Metadata displays correctly (category, read time)  
✅ Articles are SEO-friendly with proper headings  
✅ Content is comprehensive and actionable  
✅ Lawyers gain measurable profile exposure  

## Maintenance

### Monthly
- Review article analytics
- Update articles with law changes
- Add 2-3 new articles per month
- Check for broken links

### Quarterly
- Survey users for needed topics
- Interview lawyers about content performance
- Update older articles with new examples
- Optimize based on SEO performance

### Annually
- Full content audit
- Archive outdated articles
- Refresh top-performing articles
- Plan next year's content calendar
