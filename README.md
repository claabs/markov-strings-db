# markov-strings-db

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/claabs/markov-strings-db/Unit%20test%20and%20build)
[![Coverage Status](https://coveralls.io/repos/github/claabs/markov-strings-db/badge.svg?branch=master)](https://coveralls.io/github/claabs/markov-strings-db?branch=master)
![npm](https://img.shields.io/npm/v/markov-strings-db)

A rewrite of [scambier/markov-strings](https://github.com/scambier/markov-strings) made to utilize a relational SQL database rather than an in-memory object.
The goal is to reduce memory usage, disk reads/writes, remove batch corpus generation, and increase performance.

This should be mostly functionally compatible with `markov-strings` v3, however the API usage varies. This version supports importing data exports from `markov-strings` v3 for easy migration.

---

A simplistic Markov chain text generator.
Give it an array of strings, and it will output a randomly generated string.

This rewrite was created for the Discord bot [markov-discord](https://github.com/claabs/markov-discord).

## Prerequisites

- NodeJS 18+
- The host app must be configured with a [TypeORM](https://typeorm.io)-compatible database driver

## Installing

- `npm i markov-strings-db`
- Setup a database driver (this project was tested with better-sqlite3)
  - Step 4 from [this guide](https://github.com/typeorm/typeorm#installation)
- Setup a [data source config](https://typeorm.io/data-source)

## Usage

```typescript
import Markov from 'markov-strings-db';
import ormconfig from './ormconfig';
import { DataSource } from 'typeorm';

const data = [/* insert a few hundreds/thousands sentences here */];


// Instantiate the Markov generator
const markov = new Markov({ options: { stateSize: 2 }});

// If you have your own database you'd like to combine with Markov's, make sure to extend your data source options
const dataSourceOptions = await Markov.extendDataSourceOptions(ormconfig);
// Required: create a data source before using a markov instance. You only need to do this once.
const dataSource = new DataSource(dataSourceOptions);
await dataSource.initialize();

// If you have a non-default data source (you probably don't), pass it in here. Otherwise, setup() is called implicitly on any async function.
await markov.setup(dataSource);

// Add data for the generator
await markov.addData(data)

const generateOptions = {
  maxTries: 20, // Give up if I don't have a sentence after 20 tries (default is 10)

  // You may need to manually filter raw results to get something that fits your needs.
  filter: (result) => {
    return result.string.split(' ').length >= 5 && // At least 5 words
      result.string.endsWith('.')                  // End sentences with a dot.
  }
}

// Generate a sentence
const result = await markov.generate(generateOptions)
console.log(result)
/*
  {
    string: 'lorem ipsum dolor sit amet etc.',
    score: 42,
    tries: 5,
    refs: [ an array of objects ]
  }
*/

await markov.destroy();
```

## API

Each function is documented via JSDoc and its types.
Hover over a function in your IDE for details on it.
