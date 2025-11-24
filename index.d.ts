export type BorderStyle = 'round' | 'single' | 'double';
export type DescriptionDisplay = 'selected' | 'always' | 'none';
export type DescriptionPlacement = 'inline' | 'footer';
export type HighlightFn = (text: string) => string;

export type ChoiceValue =
  | string
  | {
      value: any;
      label?: string;
      description?: string;
    };

export type Choices = ChoiceValue[] | Record<string, ChoiceValue>;

export interface PickBoxOption {
  question: string;
  choices: Choices;
  defaultIndex?: number;
  borderStyle?: BorderStyle;
  selectedColor?: string | HighlightFn;
  confirm?: boolean;
  descriptionDisplay?: DescriptionDisplay;
  descriptionPlacement?: DescriptionPlacement;
  showFooterHint?: boolean;
  boxWidth?: number | null;
}

export interface PickBoxResult {
  index: number;
  value: any;
}

export function pickBox(options: PickBoxOption): Promise<PickBoxResult>;

export interface MultiPickBoxOption extends PickBoxOption {}

export interface MultiPickBoxResult {
  indices: number[];
  values: any[];
}

export function multiPickBox(options: MultiPickBoxOption): Promise<MultiPickBoxResult>;
