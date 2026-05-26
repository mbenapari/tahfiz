interface SurahMetadata {
  number: number;
  name: string;
  ayah_count: number;
}

export interface RevisionValidationInput {
  surahNumber?: number;
  startSurahNumber?: number;
  endSurahNumber?: number;
  startAyah?: number;
  endAyah?: number;
  startPage?: number;
  endPage?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Detects the type of revision record from the input
 */
function detectRevisionType(input: RevisionValidationInput): 'single_surah' | 'surah_range' | 'page_range' | 'invalid' {
  if (input.startSurahNumber && input.endSurahNumber) {
    return 'surah_range';
  }
  if (input.surahNumber) {
    return 'single_surah';
  }
  if (input.startPage || input.endPage) {
    return 'page_range';
  }
  return 'invalid';
}

/**
 * Validates a single-surah revision record
 */
async function validateSingleSurahRevision(
  input: RevisionValidationInput,
  getSurahByNumber: (num: number) => Promise<SurahMetadata | null>
): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!input.startAyah || !input.endAyah) {
    errors.push('Revision record must include a start and end ayah');
    return { isValid: false, errors };
  }

  const startAyah = Number(input.startAyah);
  const endAyah = Number(input.endAyah);
  const surahNumber = Number(input.surahNumber!);

  if (startAyah < 1) {
    errors.push('Revision start ayah must be at least 1');
  }

  if (startAyah > endAyah) {
    errors.push('Revision start cannot be greater than end');
  }

  const surah = await getSurahByNumber(surahNumber);
  if (!surah) {
    errors.push(`Invalid revision surah number: ${surahNumber}`);
  } else {
    if (endAyah > surah.ayah_count) {
      errors.push(`Revision end ayah cannot be more than ${surah.ayah_count} (total ayahs in ${surah.name})`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a surah range revision record
 */
async function validateSurahRangeRevision(
  input: RevisionValidationInput,
  getSurahByNumber: (num: number) => Promise<SurahMetadata | null>
): Promise<ValidationResult> {
  const errors: string[] = [];

  const startSurahNumber = Number(input.startSurahNumber!);
  const endSurahNumber = Number(input.endSurahNumber!);

  if (startSurahNumber > endSurahNumber) {
    errors.push('Start surah cannot be greater than end surah');
  }

  if (startSurahNumber === endSurahNumber) {
    return validateSingleSurahRevision({ ...input, surahNumber: startSurahNumber }, getSurahByNumber);
  }

  const startSurah = await getSurahByNumber(startSurahNumber);
  const endSurah = await getSurahByNumber(endSurahNumber);

  if (!startSurah || !endSurah) {
    errors.push('Invalid surah range');
  } else {
    if (input.startAyah !== undefined) {
      const startAyah = Number(input.startAyah);
      if (startAyah < 1) {
        errors.push('Revision start ayah must be at least 1');
      }
      if (startAyah > startSurah.ayah_count) {
        errors.push(`Revision start ayah (${startAyah}) cannot be more than ${startSurah.ayah_count} (total ayahs in ${startSurah.name})`);
      }
    }

    if (input.endAyah !== undefined) {
      const endAyah = Number(input.endAyah);
      if (endAyah < 1) {
        errors.push('Revision end ayah must be at least 1');
      }
      if (endAyah > endSurah.ayah_count) {
        errors.push(`Revision end ayah (${endAyah}) cannot be more than ${endSurah.ayah_count} (total ayahs in ${endSurah.name})`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validates a page range revision record
 */
function validatePageRangeRevision(input: RevisionValidationInput): ValidationResult {
  const errors: string[] = [];

  if (!input.startPage || !input.endPage) {
    errors.push('Revision record must include a start and end page');
  } else {
    const startPage = Number(input.startPage);
    const endPage = Number(input.endPage);

    if (startPage < 1) {
      errors.push('Revision start page must be at least 1');
    }

    if (startPage > endPage) {
      errors.push('Revision start page cannot be greater than end page');
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Main validation function for revision records
 */
export async function validateRevisionRecord(
  input: RevisionValidationInput,
  getSurahByNumber: (num: number) => Promise<SurahMetadata | null>
): Promise<ValidationResult> {
  const revisionType = detectRevisionType(input);

  switch (revisionType) {
    case 'single_surah':
      return validateSingleSurahRevision(input, getSurahByNumber);
    case 'surah_range':
      return validateSurahRangeRevision(input, getSurahByNumber);
    case 'page_range':
      return validatePageRangeRevision(input);
    case 'invalid':
      return { isValid: false, errors: ['Invalid revision record format'] };
    default:
      return { isValid: false, errors: ['Unknown revision type'] };
  }
}
