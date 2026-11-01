import { Component } from '@angular/core';
import { GDPR_CONSENT_VERSION } from '../gdpr-consent';

export const PRIVACY_CONTROLLER = {
  name: 'Studio medico La Mole (demo)',
  address: 'Via Esempio 1, 10100 Torino',
  email: 'privacy@lamole.example'
};

@Component({
  selector: 'app-privacy-notice',
  imports: [],
  templateUrl: './privacy-notice.html',
  styleUrl: './privacy-notice.scss',
})
export class PrivacyNotice {
  protected readonly controller = PRIVACY_CONTROLLER;
  protected readonly version = GDPR_CONSENT_VERSION;
  protected readonly effectiveFrom = '30 settembre 2026';
}
