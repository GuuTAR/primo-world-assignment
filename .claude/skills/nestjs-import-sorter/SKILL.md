---
name: nestjs-import-sorter
description: Sorts and groups imports in NestJS TypeScript files using a consistent project-specific order, including separate blank-line groups for each external module. Use when creating, editing, refactoring, or sorting imports in NestJS projects.
---

# NestJS Import Sorter

## Purpose

Organize import declarations in NestJS TypeScript files into groups according to the rules below.

Use exactly one blank line between non-empty groups. Imports from different external project modules in Group 6 must also be separated by exactly one blank line.

Only modify import declarations and their associated formatting. Do not change business logic or unrelated code.

## Import Group Order

### Group 1: NestJS packages

All imports whose source starts with `@nestjs/`.

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
```

Keep all NestJS package imports together without blank lines between them.

### Group 2: Other external packages

All imports from external packages, excluding `@nestjs/` packages.

```ts
import { join } from 'node:path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { z } from 'zod';
```

Keep all external packages together in one group. Do not create separate groups for different npm packages or package scopes.

### Group 3: Common aliases

All imports whose source starts with `@/common/`.

```ts
import { CustomException } from '@/common/exceptions/custom.exception';
import { LoggerService } from '@/common/logger/logger.service';
```

### Group 4: Firebase aliases

All imports whose source starts with `@/firebase/`.

```ts
import { FirebaseModule } from '@/firebase/firebase.module';
import { FirebaseService } from '@/firebase/firebase.service';
```

### Group 5: Config aliases

All imports whose source starts with `@/config/`.

```ts
import { appConfig } from '@/config/app.config';
import { EnvironmentConfig } from '@/config/environment.config';
```

### Group 6: Other project modules

All imports from `@/{module}/` that belong to other modules, excluding the paths reserved for Groups 3, 4, and 5 and excluding the current module.

Rules:

1. Group imports by their top-level module path.
2. Sort module groups alphabetically by module name.
3. Separate each module group with exactly one blank line.
4. Sort imports alphabetically by source path within each module.
5. Do not insert blank lines between imports belonging to the same module.
6. Never merge imports from different modules into one group.
7. Do not include the current module in this group.

Example:

```ts
import { OrdersModule } from '@/orders/orders.module';
import { OrdersService } from '@/orders/orders.service';

import { PaymentsModule } from '@/payments/payments.module';
import { PaymentsService } from '@/payments/payments.service';

import { ProductsModule } from '@/products/products.module';
import { ProductsService } from '@/products/products.service';
```

Each module has its own group, even though all imports use the `@/` alias.

### Group 7: Current module

All imports from the current module's own `@/{module}/` path.

Determine the current module from the file being edited and the project's directory structure.

For example, when editing `src/users/users.controller.ts`, imports from `@/users/` belong to Group 7.

```ts
import { UsersRepository } from '@/users/users.repository';
import { UsersService } from '@/users/users.service';
```

Keep all current-module imports together in one group. Sort them alphabetically by source path without blank lines between them.

Do not separate the current module's imports into multiple groups based on subdirectories.

If the current module cannot be identified confidently, inspect the project structure and related files. If it remains ambiguous, ask the user rather than guessing.

### Group 8: Other imports

All remaining imports that do not match Groups 1–7, including relative imports and other project-specific aliases.

```ts
import { SharedType } from '../../types/shared-type';
import { RequestContext } from '@/types/request-context';
import './bootstrap';
```

Sort by source path. Keep these imports together in one group unless preserving comments or existing semantics requires otherwise.

## Classification Priority

Classify each import using its module source string and apply the following precedence:

1. Source starts with `@nestjs/` → Group 1.
2. External package import → Group 2.
3. Source starts with `@/common/` → Group 3.
4. Source starts with `@/firebase/` → Group 4.
5. Source starts with `@/config/` → Group 5.
6. Source starts with `@/` and belongs to another module → Group 6.
7. Source starts with `@/` and belongs to the current module → Group 7.
8. All remaining imports → Group 8.

Groups 3–5 take precedence over the general module rules.

Determine whether a package is external or belongs to the project using the import source, package configuration, and project structure. Do not classify an import solely by the name of the imported symbol.

## Sorting and Formatting Rules

1. Keep the original import declarations and their semantics.
2. Sort imports alphabetically by module source path within each group.
3. Sort Group 6 module groups alphabetically by top-level module name.
4. Use exactly one blank line between non-empty groups.
5. In Group 6, use exactly one blank line between different module groups.
6. Do not add blank lines between imports within the same group.
7. Omit empty groups entirely.
8. Preserve named, default, namespace, side-effect, and type-only imports.
9. Preserve existing file extensions, including `.js`, `.ts`, or no extension. Never add, remove, or rewrite extensions as part of sorting.
10. Preserve quote style, aliases, semicolons, and existing project formatting conventions.
11. Preserve comments and keep them associated with the appropriate imports.
12. Do not merge, split, or remove import declarations unless explicitly requested.
13. Do not modify non-import code or unrelated files.
14. Ensure the final result is deterministic and idempotent: sorting the same file again must not change the result.

## Example

Assume the current file is `src/users/users.controller.ts`.

Before:

```ts
import { UsersService } from '@/users/users.service';
import { PaymentsService } from '@/payments/payments.service';
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@/common/logger/logger.service';
import { Model } from 'mongoose';
import { FirebaseService } from '@/firebase/firebase.service';
import { OrdersService } from '@/orders/orders.service';
import { appConfig } from '@/config/app.config';
import { UsersRepository } from '@/users/users.repository';
import { ProductsService } from '@/products/products.service';
import { join } from 'node:path';
import { OrdersModule } from '@/orders/orders.module';
import '../shared/bootstrap';
```

After:

```ts
import { Injectable } from '@nestjs/common';

import { join } from 'node:path';
import { Model } from 'mongoose';

import { LoggerService } from '@/common/logger/logger.service';

import { FirebaseService } from '@/firebase/firebase.service';

import { appConfig } from '@/config/app.config';

import { OrdersModule } from '@/orders/orders.module';
import { OrdersService } from '@/orders/orders.service';

import { PaymentsService } from '@/payments/payments.service';

import { ProductsService } from '@/products/products.service';

import { UsersRepository } from '@/users/users.repository';
import { UsersService } from '@/users/users.service';

import '../shared/bootstrap';
```

## Workflow

1. Identify the target file or files.
2. Inspect the directory structure and alias configuration to identify the current module.
3. Read the existing import declarations.
4. Classify every import into exactly one group.
5. Sort each group by source path.
6. For Group 6, group imports by module and separate module groups with one blank line.
7. Rewrite the import section while preserving existing syntax and comments.
8. Verify that every original import remains present and that no non-import code has changed.

When the user requests import sorting only, do not perform unrelated refactoring.
