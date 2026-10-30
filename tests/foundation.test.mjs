import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const workspaces = ['customer', 'provider', 'admin', 'api'];

test('all required applications have workspace manifests', () => {
  for (const workspace of workspaces) {
    assert.equal(existsSync(`apps/${workspace}/package.json`), true, workspace);
    const manifest = JSON.parse(readFileSync(`apps/${workspace}/package.json`, 'utf8'));
    assert.equal(manifest.name, `@home-services/${workspace}`);
    assert.equal(typeof manifest.scripts.dev, 'string');
    assert.equal(typeof manifest.scripts.build, 'string');
    assert.equal(typeof manifest.scripts.typecheck, 'string');
  }
});

test('development infrastructure and CI are provided', () => {
  for (const path of ['compose.yaml', '.env.example', '.github/workflows/ci.yml']) {
    assert.equal(existsSync(path), true, path);
  }
});
