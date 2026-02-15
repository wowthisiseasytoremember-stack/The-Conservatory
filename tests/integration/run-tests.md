# Running Integration Tests

## Quick Start

The integration tests are ready to run. Due to Windows permission issues with Playwright's temp directories, you may need to run them manually.

## Option 1: Run via npm script

```bash
npm run test:integration
```

## Option 2: Run directly with Playwright

```bash
npx playwright test tests/integration
```

## Option 3: Run with UI (Recommended for first run)

```bash
npx playwright test tests/integration --ui
```

This opens a visual test runner where you can:
- See tests running in real-time
- View console logs with enrichment data
- Debug any issues
- See browser interactions

## Option 4: Run specific test

```bash
# Run just enrichment pipeline tests
npx playwright test tests/integration/enrichment-integration.spec.ts -g "Enrichment Pipeline"

# Run just one species
npx playwright test tests/integration/enrichment-integration.spec.ts -g "Neon Tetra"
```

## What to Expect

When tests run, you'll see:

1. **Console Output** with full enrichment data:
   ```
   === Enrichment Data for Neon Tetra ===
   {
     "name": "Neon Tetra",
     "scientificName": "Paracheirodon innesi",
     "overflow": {
       "taxonomy": { ... },
       "discovery": { "mechanism": "..." }
     }
   }
   ```

2. **Performance Metrics**:
   ```
   First enrichment: ~45000ms (API calls)
   Second enrichment: 234ms (cache hit)
   ```

3. **Data Quality Reports**:
   ```
   hasTaxonomy: true
   hasDiscovery: true
   mechanismLength: 245
   ```

## Troubleshooting

### Permission Errors
If you see `EPERM` errors:
- Try running as Administrator
- Or run with `--reporter=list` flag
- Or use the UI mode: `--ui`

### Timeout Errors
Tests have a 2-minute timeout. If they timeout:
- Check internet connection
- Verify API keys are set
- Some APIs may be slow

### Missing Test Images
Vision tests will automatically skip if images aren't in `tests/fixtures/`

## Next Steps After Running

1. Review the console output to see actual enrichment data
2. Check what fields are populated vs. missing
3. Adjust test expectations based on real API behavior
4. Add more species to test suite if needed
