const fs = require('fs');
const path = require('path');
require('dotenv').config();
const twilio = require('twilio');

const DEFAULT_CONFIG_PATH = path.join(__dirname, '..', 'config', 'tfv-submission.json');
const DEFAULT_EXAMPLE_PATH = path.join(__dirname, '..', 'config', 'tfv-submission.example.json');

function loadJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function buildRequestBody(config) {
  if (config && typeof config === 'object' && config.requestBody && typeof config.requestBody === 'object') {
    return config.requestBody;
  }

  if (config && typeof config === 'object') {
    const cloned = { ...config };
    delete cloned.note;
    delete cloned.requestBody;
    delete cloned.tfvSid;
    return cloned;
  }

  return {};
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return undefined;
}

function normalizeBusinessRegistrationAuthority(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  const aliases = {
    'USA: Employer Identification Number (EIN)': 'EIN',
    'US: Employer Identification Number (EIN)': 'EIN',
    'US:EIN': 'EIN',
  };

  return aliases[trimmed] || trimmed;
}

function normalizePayload(rawBody) {
  const body = { ...rawBody };

  const normalized = {};
  const passThroughKeys = [
    'customerProfileSid',
    'tollfreePhoneNumber',
    'notificationEmail',
    'businessName',
    'businessWebsite',
    'useCaseSummary',
    'productionMessageSample',
    'optInType',
    'messageVolume',
    'businessStreetAddress',
    'businessStreetAddress2',
    'businessCity',
    'businessStateProvinceRegion',
    'businessPostalCode',
    'businessCountry',
    'additionalInformation',
    'businessContactFirstName',
    'businessContactLastName',
    'businessContactEmail',
    'businessContactPhone',
    'themeSetId',
    'skipMessagingUseCase',
    'businessRegistrationNumber',
    'businessRegistrationAuthority',
    'businessRegistrationCountry',
    'businessType',
    'doingBusinessAs',
    'optInConfirmationMessage',
    'helpMessageSample',
    'privacyPolicyUrl',
    'termsAndConditionsUrl',
    'ageGatedContent',
    'externalReferenceId',
    'vettingId',
    'vettingProvider',
  ];

  for (const key of passThroughKeys) {
    if (body[key] !== undefined) {
      normalized[key] = body[key];
    }
  }

  if (normalized.businessRegistrationAuthority !== undefined) {
    normalized.businessRegistrationAuthority = normalizeBusinessRegistrationAuthority(
      normalized.businessRegistrationAuthority,
    );
  }

  const aliases = {
    legal_name: 'businessName',
    business_name: 'businessName',
    dba: 'doingBusinessAs',
    company_type: 'businessType',
    business_registration_issuing_country: 'businessRegistrationCountry',
    business_registration_country: 'businessRegistrationCountry',
    business_registration_id_type: 'businessRegistrationAuthority',
    business_registration_authority: 'businessRegistrationAuthority',
    business_registration_number: 'businessRegistrationNumber',
    business_website_url: 'businessWebsite',
    business_website: 'businessWebsite',
    address_country: 'businessCountry',
    address_street_line_1: 'businessStreetAddress',
    address_street_line_2: 'businessStreetAddress2',
    address_city: 'businessCity',
    address_province_state_subdivision: 'businessStateProvinceRegion',
    address_state: 'businessStateProvinceRegion',
    address_postal_code: 'businessPostalCode',
    first_name: 'businessContactFirstName',
    last_name: 'businessContactLastName',
    email_address: 'businessContactEmail',
    phone_number: 'businessContactPhone',
    estimated_monthly_sms_volume: 'messageVolume',
    use_case: 'useCaseSummary',
    use_case_description: 'useCaseSummary',
    sample_message: 'productionMessageSample',
    opt_in_type: 'optInType',
    opt_in_policy_proof: 'optInImageUrls',
    terms_and_conditions_url: 'termsAndConditionsUrl',
    privacy_policy_url: 'privacyPolicyUrl',
    opt_in_keywords: 'optInKeywords',
    opt_in_message: 'optInConfirmationMessage',
    help_message: 'helpMessageSample',
    additional_information: 'additionalInformation',
    notification_email: 'notificationEmail',
  };

  for (const [sourceKey, targetKey] of Object.entries(aliases)) {
    if (body[sourceKey] !== undefined) {
      normalized[targetKey] = body[sourceKey];
    }
  }

  if (normalized.businessRegistrationAuthority !== undefined) {
    normalized.businessRegistrationAuthority = normalizeBusinessRegistrationAuthority(
      normalized.businessRegistrationAuthority,
    );
  }

  if (body.optInKeywords !== undefined) {
    normalized.optInKeywords = toArray(body.optInKeywords);
  }
  if (body.optInImageUrls !== undefined) {
    normalized.optInImageUrls = toArray(body.optInImageUrls);
  }
  if (body.useCaseCategories !== undefined) {
    normalized.useCaseCategories = toArray(body.useCaseCategories);
  }

  if (normalized.messageVolume && typeof normalized.messageVolume === 'number') {
    normalized.messageVolume = String(normalized.messageVolume);
  }

  return normalized;
}

async function main() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const dryRun = ['1', 'true', 'yes', 'on'].includes((process.env.TFV_API_DRY_RUN || '').toLowerCase());
  const client = twilio(accountSid, authToken);

  if (!accountSid || !authToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in the environment.');
  }

  const configPath = process.env.TFV_SUBMISSION_FILE || DEFAULT_CONFIG_PATH;
  const examplePath = DEFAULT_EXAMPLE_PATH;
  const config = loadJsonIfExists(configPath) || loadJsonIfExists(examplePath);

  if (!config) {
    throw new Error(`No TFV submission file found. Create ${configPath} or use ${examplePath}.`);
  }

  const requestBody = normalizePayload(buildRequestBody(config));
  const tfvSid = config.tfvSid || process.env.TFV_SID;

  if (!tfvSid) {
    throw new Error('config.tfvSid (or env TFV_SID) is required for the update path. Set it in tfv-submission.json.');
  }

  console.log('TFV API resubmission helper');
  console.log(`- API: messaging.v1.tollfreeVerifications(sid).update`);
  console.log(`- TFV SID: ${tfvSid}`);
  console.log(`- Payload file: ${configPath}`);
  if (config.note) {
    console.log(`- Note: ${config.note}`);
  }

  if (dryRun) {
    console.log('\nDry run enabled. Normalized Twilio params:');
    console.log(JSON.stringify(requestBody, null, 2));
    return;
  }

  const updated = await client.messaging.v1.tollfreeVerifications(tfvSid).update(requestBody);
  console.log('TFV update succeeded.');
  console.log(JSON.stringify({ sid: updated.sid, status: updated.status, dateUpdated: updated.dateUpdated }, null, 2));
}

main().catch((error) => {
  console.error('TFV API resubmission helper failed.');
  console.error(error.message);
  process.exitCode = 1;
});