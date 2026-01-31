# DocuSeal Template Builder

A Next.js application that allows you to upload DOCX templates with `{{tag_name}}` placeholders, automatically extract tag coordinates, and create DocuSeal templates and submissions.

## Features

- Upload DOCX files with field placeholders
- Automatically extract and detect field types (signature, text, date, etc.)
- Automatically infer field roles (Client, Service Provider, etc.)
- Visual field editor with draggable/resizable boxes
- Create DocuSeal templates via API
- Manage submissions and send documents for signing
- Track submission status

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** Zustand
- **File Processing:** mammoth.js for DOCX text extraction
- **API Integration:** DocuSeal REST API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- DocuSeal API key ([Get one here](https://www.docuseal.com))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd docuseal-builder
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your DocuSeal API key:
```env
DOCUSEAL_API_KEY=your_api_key_here
DOCUSEAL_API_URL=https://api.docuseal.com
```

For EU region, use:
```env
DOCUSEAL_API_URL=https://api.docuseal.eu
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Template

1. **Prepare your DOCX file:**
   - Add placeholders in the format `{{tag_name}}`
   - Example: `{{client_name}}`, `{{client_signature}}`, `{{provider_date}}`

2. **Upload the file:**
   - Navigate to Templates → New Template
   - Upload your DOCX file
   - The app will automatically extract tags and detect field types

3. **Review extracted fields:**
   - Check the detected field types (signature, text, date, etc.)
   - Review the inferred roles (Client, Service Provider, etc.)

4. **Create template:**
   - Click "Create Template" to save to DocuSeal
   - The template is now ready to use

### Field Type Detection

The app automatically detects field types based on tag names:

- **Signature:** `_signature`, `signature`, `_sign`
- **Initials:** `_initials`, `initials`
- **Date:** `_date`, `date`
- **Image:** `_image`, `image`, `photo`
- **Checkbox:** `checkbox`, `check_`, `_agree`
- **Phone:** `phone`, `telephone`, `mobile`
- **Number:** `_amount`, `amount`, `price`
- **Text:** Default for all other tags

### Role Detection

The app automatically infers roles based on tag prefixes:

- **Service Provider:** `provider_`, `vendor_`, `seller_`
- **Client:** `client_`, `customer_`, `buyer_`, `tenant_`
- **First Party:** Default role

### Advanced Tag Syntax

You can specify field properties directly in tags:

```
{{tag_name;type=signature;role=Client;required=true}}
```

Supported attributes:
- `type` - Field type (signature, text, date, etc.)
- `role` - Signer role
- `required` - true/false
- `readonly` - true/false
- `default_value` - Pre-fill value
- `placeholder` - Hint text

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── extract-coordinates/    # Extract tags from DOCX
│   │   └── docuseal/
│   │       ├── templates/          # Template CRUD operations
│   │       └── submissions/        # Submission management
│   ├── templates/                  # Template pages
│   ├── submissions/                # Submission pages
│   ├── settings/                   # Settings page
│   └── layout.tsx
├── components/
│   ├── ui/                         # shadcn components
│   ├── Navigation.tsx              # Main navigation
│   └── FileUpload.tsx              # File upload component
├── lib/
│   ├── docuseal.ts                 # DocuSeal API client
│   ├── extract-tags.ts             # Tag extraction logic
│   └── infer-types.ts              # Type/role inference
├── stores/
│   └── templateStore.ts            # Zustand state management
└── types/
    └── index.ts                    # TypeScript types
```

## API Routes

### Templates
- `GET /api/docuseal/templates` - List all templates
- `POST /api/docuseal/templates` - Create new template
- `GET /api/docuseal/templates/[id]` - Get template details
- `PUT /api/docuseal/templates/[id]` - Update template
- `DELETE /api/docuseal/templates/[id]` - Archive template

### Submissions
- `GET /api/docuseal/submissions` - List all submissions
- `POST /api/docuseal/submissions` - Create new submission
- `GET /api/docuseal/submissions/[id]` - Get submission details

### Coordinate Extraction
- `POST /api/extract-coordinates` - Extract tags from DOCX file

## Production Notes

### DOCX to PDF Conversion

The current implementation uses mock coordinates for field positions. For production, you need to implement actual DOCX→PDF conversion and coordinate extraction:

**Option 1: Python Microservice (Recommended)**
```python
# Use PyMuPDF (fitz) for accurate coordinate extraction
import fitz
from docx2pdf import convert

def extract_coordinates(docx_file):
    # Convert DOCX to PDF
    pdf_path = convert(docx_file)

    # Extract tag positions
    doc = fitz.open(pdf_path)
    fields = []

    for page_num, page in enumerate(doc, 1):
        # Search for tags and get coordinates
        instances = page.search_for("{{")
        for inst in instances:
            # Calculate percentage-based coordinates
            ...

    return fields
```

**Option 2: LibreOffice Headless**
```bash
# Install LibreOffice
apt-get install libreoffice

# Convert DOCX to PDF
soffice --headless --convert-to pdf --outdir /tmp file.docx
```

### Deployment Checklist

- [ ] Set `DOCUSEAL_API_KEY` environment variable
- [ ] Configure `DOCUSEAL_API_URL` (use EU endpoint if needed)
- [ ] Implement production coordinate extraction
- [ ] Set up file storage (S3, Cloudflare R2, or Vercel Blob)
- [ ] Configure error monitoring (Sentry)
- [ ] Set up rate limiting
- [ ] Enable HTTPS/SSL

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCUSEAL_API_KEY` | DocuSeal API key (required) | - |
| `DOCUSEAL_API_URL` | DocuSeal API endpoint | `https://api.docuseal.com` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `DocuSeal Template Builder` |
| `NEXT_PUBLIC_MAX_FILE_SIZE_MB` | Max upload size | `10` |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Resources

- [DocuSeal API Documentation](https://www.docuseal.com/docs/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)

## Support

For issues and questions:
- Create an issue in this repository
- Check DocuSeal documentation
- Contact DocuSeal support

## Roadmap

- [ ] Visual field editor with drag-and-drop
- [ ] Production DOCX→PDF conversion
- [ ] Database integration for template persistence
- [ ] Batch template creation
- [ ] Template versioning
- [ ] Advanced field validation
- [ ] Multi-language support
- [ ] Dark mode
