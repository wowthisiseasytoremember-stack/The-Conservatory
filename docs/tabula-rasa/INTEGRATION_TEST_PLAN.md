# Integration Test Plan - Live API Testing

## Overview

This document outlines the integration test suite for The Conservatory that tests the enrichment pipeline with **real API calls** (no mocks). These tests verify:

1. **Real data structures** returned from each enrichment stage
2. **Data quality** and completeness
3. **Error handling** with real API failures
4. **Caching behavior** (species library)
5. **Vision identification** with actual images

## Test Suite Structure

### Location
- **Test File**: `tests/integration/enrichment-integration.spec.ts`
- **Fixtures**: `tests/fixtures/` (test images)
- **Documentation**: `tests/integration/README.md`

### Test Categories

#### 1. Enrichment Pipeline Tests
Tests the full 5-stage enrichment pipeline with live API calls:

**Stages Tested:**
- ✅ **Stage 1**: Local Library (plantService) - Fast, local data
- ✅ **Stage 2**: GBIF Taxonomy - Scientific classification
- ✅ **Stage 3**: Wikipedia - General knowledge
- ✅ **Stage 4**: iNaturalist - Common names, images
- ✅ **Stage 5**: AI Discovery (Gemini) - Biological mechanisms (critical)

**Species Tested:**
- Neon Tetra (Paracheirodon innesi) - Common fish
- Betta (Betta splendens) - Popular fish
- Guppy (Poecilia reticulata) - Common fish
- Java Fern (Microsorum pteropus) - Common plant
- Anubias (Anubias barteri) - Common plant
- Cherry Shrimp (Neocaridina davidi) - Common invertebrate

**What Gets Validated:**
- Enrichment completes successfully
- All data structures are present
- Taxonomy data (GBIF)
- Discovery mechanism (AI) - **Critical**
- Scientific names
- Reference images
- Descriptions

#### 2. Caching Tests
Verifies species library caching works correctly:

- **First enrichment**: Makes real API calls (~30-60 seconds)
- **Second enrichment**: Uses cache (< 1 second)
- Validates cache hit performance
- Verifies cached data matches original

#### 3. Error Handling Tests
Tests graceful handling of edge cases:

- Unknown species (should not crash)
- Generic names (e.g., "Fish")
- API failures (should continue with partial data)
- Invalid inputs

#### 4. Vision Identification Tests
Tests photo identification with real images:

- Requires test images in `tests/fixtures/`
- Validates identification accuracy
- Tests full accession flow from photo
- Error handling for invalid images

#### 5. Data Quality Tests
Comprehensive validation of enrichment data:

- **Structure validation**: All required fields present
- **Data type validation**: Correct types and formats
- **Completeness metrics**: What percentage of fields are populated
- **Cross-species comparison**: Data quality across different species

## Running the Tests

### Prerequisites
1. **API Keys**: Valid Gemini API key (for AI discovery)
2. **Internet Connection**: Required for all API calls
3. **Test Images**: Optional, for vision tests (place in `tests/fixtures/`)
4. **Firestore**: Test user account configured

### Commands

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

### Test Timeout
Tests have a 2-minute timeout per test to account for:
- Network latency
- API response times
- Full enrichment pipeline (5 stages)

## Expected Output

### Console Logs
Tests log detailed information:

1. **Full Enrichment Data**
   ```json
   {
     "id": "entity-123",
     "name": "Neon Tetra",
     "scientificName": "Paracheirodon innesi",
     "enrichment_status": "complete",
     "details": { "description": "..." },
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
   ```

2. **Stage Progression**
   ```
   Expected stages: library, gbif, wikipedia, inaturalist, discovery
   Data present: taxonomy, discovery, referenceImages
   ```

3. **Performance Metrics**
   ```
   First enrichment: ~45000ms (API calls)
   Second enrichment: 234ms (cache hit)
   ```

4. **Data Quality Metrics**
   ```
   hasTaxonomy: true
   hasDiscovery: true
   hasMechanism: true
   mechanismLength: 245
   hasImages: true
   ```

### Test Results
- ✅ **Pass**: All validations pass, data structure is correct
- ⚠️ **Warn**: Some optional fields missing (logged but doesn't fail)
- ❌ **Fail**: Critical fields missing or data structure invalid

## What to Look For

### ✅ Success Indicators
- All 5 enrichment stages complete
- Discovery mechanism is present and substantial (> 20 chars)
- Scientific name is populated
- Taxonomy data is present (GBIF)
- Cache hit is fast (< 5 seconds)

### ⚠️ Warning Signs
- Missing taxonomy (GBIF may not have data for some species)
- Missing description (Wikipedia may not have article)
- Missing images (iNaturalist may not have photos)
- These are acceptable - enrichment can succeed with partial data

### ❌ Failure Indicators
- No discovery mechanism (critical stage failed)
- Enrichment status is "failed" (all stages failed)
- Data structure is malformed
- These indicate real problems that need fixing

## Cost Considerations

### API Costs (per test run)
- **Gemini API**: ~$0.001-0.01 per enrichment
  - Flash model: ~$0.001
  - Pro model: ~$0.01
- **GBIF**: Free (public API)
- **Wikipedia**: Free (public API)
- **iNaturalist**: Free (public API)

### Estimated Cost
- **Single test run**: ~$0.05-0.20
- **Full test suite**: ~$0.20-0.50
- **Daily CI runs**: ~$6-15/month

### Cost Optimization
- Tests use cache when possible (2nd enrichment is free)
- Can skip vision tests if images not provided
- Can run subset of species tests

## Next Steps

### Immediate
1. ✅ Test suite created
2. ⏳ Add test images to `tests/fixtures/`
3. ⏳ Run initial test pass
4. ⏳ Review actual data structures
5. ⏳ Adjust expectations based on real API behavior

### Future Enhancements
- [ ] Add more species to test suite
- [ ] Add performance benchmarks
- [ ] Add data quality scoring
- [ ] Add regression tests for data structure changes
- [ ] Add visual regression tests for UI
- [ ] Add load testing (multiple enrichments in parallel)

## Troubleshooting

### Common Issues

**Tests Timeout**
- Increase timeout: `test.setTimeout(180000)` (3 minutes)
- Check API keys are valid
- Check internet connection
- Some APIs may be slow

**API Errors**
- Verify API keys in environment
- Check API rate limits
- Some APIs may be temporarily unavailable
- Check API status pages

**No Test Images**
- Vision tests will be skipped automatically
- Add images to `tests/fixtures/` to enable

**Firestore Errors**
- Ensure test user account is set up
- Check Firestore permissions
- Tests use: `integration-test-user`

## Integration with CI/CD

### Recommended CI Setup
```yaml
# Example GitHub Actions
- name: Run Integration Tests
  run: npm run test:integration
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  timeout-minutes: 30
```

### CI Considerations
- Tests are slower (real API calls)
- May need longer timeout
- Should run on schedule, not every commit
- Consider running nightly or weekly

## Related Documentation

- **Test Implementation**: `tests/integration/enrichment-integration.spec.ts`
- **Test README**: `tests/integration/README.md`
- **Enrichment Pipeline**: `docs/tabula-rasa/PASS1_TECHNICAL.md`
- **Species Library**: `services/speciesLibrary.ts`
- **Enrichment Service**: `services/enrichmentService.ts`
