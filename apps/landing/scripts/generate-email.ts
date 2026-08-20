import { render } from '@react-email/components';
import { ResetPasswordEmail } from '../src/emails/ResetPasswordEmail';
import * as fs from 'fs';
import * as path from 'path';
import * as React from 'react';

async function main() {
    console.log('Generating HTML...');
    // We need to pass the element directly, since it's a component
    const html = await render(React.createElement(ResetPasswordEmail));
    const outPath = path.join(__dirname, 'reset-password.html');
    fs.writeFileSync(outPath, html);
    console.log('Done! Saved to', outPath);
}

main().catch(console.error);
