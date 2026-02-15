# Integration Tests - Live API Testing

This directory contains integration tests that make **real API calls** to verify the enrichment pipeline works end-to-end with actual data.

## ⚠️ Important Notes

- **These tests make real API calls** and may incur costs (Gemini API, etc.)
- **Tests may be slower** due to network latency and API rate limits
- **Tests require internet connection** and valid API keys
- **Test data is written to Firestore** (use test user account)

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npx playwright test tests/integration/enrichment-integration.spec.ts

# Run with UI (helpful for debugging)
npx playwright test tests/integration/enrichment-integration.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test tests/integration/enrichment-integration.spec.ts --headed
```

## Test Structure

### 1. Enrichment Pipeline Tests
Tests the full 5-stage enrichment pipeline:
- **Stage 1**: Local Library (plantService)
- **Stage 2**: GBIF Taxonomy
- **Stage 3**: Wikipedia
- **Stage 4**: iNaturalist
- **Stage 5**: AI Discovery (Gemini)

Each test:
- Creates a test habitat and entity
- Triggers enrichment with real API calls
- Captures and validates the actual data returned
- Logs the full data structure for inspection

### 2. Vision Identification Tests
Tests photo identification with real images:
- Requires test images in `tests/fixtures/`
- Validates identification accuracy
- Tests error handling

### 3. Data Quality Tests
Validates enrichment data structure and completeness:
- Checks all required fields are present
- Validates data types and formats
- Compares data quality across multiple species

## Test Images

Place test images in `tests/fixtures/`:
- `test-fish.jpg` - Fish species photo
- `test-plant.jpg` - Plant species photo
- `test-invertebrate.jpg` - Invertebrate photo

If images are not provided, vision tests will be skipped.

## What Gets Tested

### ✅ Happy Path
- Common aquarium species (Neon Tetra, Betta, Guppy, Java Fern, etc.)
- Full enrichment pipeline completion
- Data structure validation
- Caching behavior (species library)

### ⚠️ Edge Cases
- Unknown species (should handle gracefully)
- Generic names (e.g., "Fish")
- Invalid image data
- API failures

### 📊 Data Validation
- Taxonomy structure (GBIF)
- Discovery mechanism (AI)
- Scientific names
- Reference images
- Descriptions

## Expected Output

Tests will log:
1. **Full enrichment data** for each species
2. **Stage progression** (which stages succeeded/failed)
3. **Data quality metrics** (what fields are present)
4. **Performance metrics** (cache hit vs. API call times)
5. **Cross-species comparisons**

Example output:
```
=== Enrichment Data for Neon Tetra ===
{
  "id": "entity-123",
  "name": "Neon Tetra",
  "scientificName": "Paracheirodon innesi",
  "enrichment_status": "complete",
  "details": { ... },
  "overflow": {
    "taxonomy": { "kingdom": "Animalia", ... },
    "discovery": {
      "mechanism": "Neon tetras use iridophores...",
      "evolutionaryAdvantage": "...",
      "synergyNote": "..."
    },
    "referenceImages": [ ... ]
  }
}

=== Cache Performance ===
First enrichment: ~45000ms (API calls)
Second enrichment: 234ms (cache hit)
```

## Troubleshooting

### Tests Timeout
- Increase timeout in test file: `test.setTimeout(180000)` (3 minutes)
- Check API keys are valid
- Check internet connection

### API Errors
- Verify API keys in environment variables
- Check API rate limits haven't been exceeded
- Some APIs may be temporarily unavailable

### No Test Images
- Vision tests will be skipped if images not found
- Add images to `tests/fixtures/` to enable vision tests

### Firestore Errors
- Ensure test user account is set up
- Check Firestore permissions
- Tests use test user ID: `integration-test-user`

## Cost Considerations

These tests make real API calls:
- **Gemini API**: ~$0.001-0.01 per enrichment (depends on model)
- **GBIF**: Free (public API)
- **Wikipedia**: Free (public API)
- **iNaturalist**: Free (public API)

Running all tests once: ~$0.05-0.20 (estimate)

## Next Steps

After running integration tests:
1. Review logged data structures
2. Verify data quality meets expectations
3. Check for missing fields or incomplete enrichments
4. Update test expectations based on real API behavior
5. Add more species to test suite as needed
