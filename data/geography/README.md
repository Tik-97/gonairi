# Geography seed source

`countries-and-regions.json` is the canonical seed-time source supplied for this project. Runtime application code reads normalized `Country`, `Region`, and `TourRegion` database tables; it does not parse this file.

- Source SHA-256: `4cec4088d41e70e49dcbb9a1e2ca7806aae263c305dc2c8d34a462bb214f3b6b`
- Countries: 249
- Regions/subdivisions: 4,387
- Records without a subdivision code: 179

The source sometimes stores `shortCode` as a suffix (`ER`) and sometimes as a complete code (`DK-84`). The importer normalizes both forms to a single country-prefixed value such as `AM-ER` or `DK-84`. Missing codes remain `NULL`; their stable database identity is derived from country code and name.

Run the importer with:

```bash
npm run seed:geography
```

The importer is transactional and idempotent. Records removed from a future version of the JSON remain in the database as inactive rows so existing tour relationships are not broken.
