import { KeyRound, Search } from "lucide-react";
import type { ComponentProps } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { CanvasGroup } from "@/pages/component-canvas/canvas-types";
import { Stateful } from "@/pages/component-canvas/demos";
import {
  SAMPLE_KEY,
  SAMPLE_MODEL_OPTIONS,
  SAMPLE_MODEL_OPTIONS_WITH_DESCRIPTION,
  SAMPLE_MODELS,
} from "@/pages/component-canvas/sample-data";

/* Inputs and forms (design.md "Inputs and forms", "Selectors"). Every
 * control in a group carries the same accessible name and sample value so
 * only the prop under comparison changes. */

const MODEL_LABELS = SAMPLE_MODELS.map((model) => model.label);

const input: CanvasGroup = {
  id: "input",
  title: "Input",
  files: ["input.tsx"],
  columns: 3,
  examples: [
    {
      label: 'surface="card" (default)',
      render: () => <Input aria-label="Key name" placeholder="prod-web" />,
    },
    {
      label: 'surface="elevated"',
      render: () => (
        <Input
          aria-label="Key name"
          placeholder="prod-web"
          surface="elevated"
        />
      ),
    },
    {
      label: "with value",
      render: () => (
        <Input aria-label="Key name" defaultValue={SAMPLE_KEY.name} />
      ),
    },
    {
      label: "disabled",
      render: () => (
        <Input aria-label="Key name" defaultValue={SAMPLE_KEY.name} disabled />
      ),
    },
    {
      label: "aria-invalid",
      render: () => (
        <Input
          aria-invalid
          aria-label="Key name"
          defaultValue={SAMPLE_KEY.name}
        />
      ),
    },
    {
      label: 'type="file"',
      render: () => <Input aria-label="Upload a file" type="file" />,
    },
  ],
};

const textarea: CanvasGroup = {
  id: "textarea",
  title: "Textarea",
  files: ["textarea.tsx"],
  columns: 3,
  examples: [
    {
      label: "default",
      render: () => (
        <Textarea aria-label="Description" placeholder="What this key is for" />
      ),
    },
    {
      label: "disabled",
      render: () => (
        <Textarea
          aria-label="Description"
          defaultValue="Production web traffic"
          disabled
        />
      ),
    },
    {
      label: "aria-invalid",
      render: () => (
        <Textarea
          aria-invalid
          aria-label="Description"
          defaultValue="Production web traffic"
        />
      ),
    },
  ],
};

const inputGroup: CanvasGroup = {
  id: "input-group",
  title: "InputGroup",
  files: ["input-group.tsx"],
  columns: 3,
  examples: [
    {
      label: 'InputGroupAddon align="inline-start"',
      render: () => (
        <InputGroup>
          <InputGroupInput aria-label="Search keys" placeholder="Search keys" />
          <InputGroupAddon align="inline-start">
            <Search aria-hidden strokeWidth={1.75} />
          </InputGroupAddon>
        </InputGroup>
      ),
    },
    {
      label: 'InputGroupAddon align="inline-end" + InputGroupButton',
      render: () => (
        <InputGroup>
          <InputGroupInput aria-label="Search keys" placeholder="Search keys" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="xs">Clear</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ),
    },
    {
      label: 'InputGroupButton size="icon-xs"',
      render: () => (
        <InputGroup>
          <InputGroupInput aria-label="Search keys" placeholder="Search keys" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton aria-label="Search" size="icon-xs">
              <Search aria-hidden strokeWidth={1.75} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      ),
    },
    {
      label: "InputGroupText",
      render: () => (
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Endpoint"
            placeholder="gateway.example.com"
          />
        </InputGroup>
      ),
    },
    {
      label: 'InputGroupTextarea + align="block-end"',
      render: () => (
        <InputGroup>
          <InputGroupTextarea
            aria-label="Description"
            placeholder="What this key is for"
          />
          <InputGroupAddon align="block-end">
            <InputGroupText>0 / 200</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ),
    },
    {
      label: 'align="block-start"',
      render: () => (
        <InputGroup>
          <InputGroupAddon align="block-start">
            <InputGroupText>
              <KeyRound aria-hidden strokeWidth={1.75} />
              Key name
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput aria-label="Key name" placeholder="prod-web" />
        </InputGroup>
      ),
    },
    {
      label: "aria-invalid on the control",
      render: () => (
        <InputGroup>
          <InputGroupInput
            aria-invalid
            aria-label="Search keys"
            defaultValue="prod-"
          />
          <InputGroupAddon align="inline-start">
            <Search aria-hidden strokeWidth={1.75} />
          </InputGroupAddon>
        </InputGroup>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <InputGroup>
          <InputGroupInput
            aria-label="Search keys"
            disabled
            placeholder="Search keys"
          />
          <InputGroupAddon align="inline-start">
            <Search aria-hidden strokeWidth={1.75} />
          </InputGroupAddon>
        </InputGroup>
      ),
    },
  ],
};

const searchInput: CanvasGroup = {
  id: "search-input",
  title: "SearchInput",
  files: ["search-input.tsx"],
  columns: 2,
  examples: [
    {
      label: 'surface="card" (default)',
      render: () => (
        <SearchInput ariaLabel="Search keys" placeholder="Search keys" />
      ),
    },
    {
      label: 'surface="elevated"',
      render: () => (
        <SearchInput
          ariaLabel="Search keys"
          placeholder="Search keys"
          surface="elevated"
        />
      ),
    },
  ],
};

const field: CanvasGroup = {
  id: "field",
  title: "Field",
  files: ["field.tsx"],
  columns: 3,
  examples: [
    {
      label: 'orientation="vertical" (default)',
      render: () => (
        <Field orientation="vertical">
          <FieldLabel htmlFor="canvas-field-vertical">Key name</FieldLabel>
          <Input id="canvas-field-vertical" placeholder="prod-web" />
        </Field>
      ),
    },
    {
      label: 'orientation="horizontal"',
      render: () => (
        <Field orientation="horizontal">
          <FieldLabel htmlFor="canvas-field-horizontal">Key name</FieldLabel>
          <Input id="canvas-field-horizontal" placeholder="prod-web" />
        </Field>
      ),
    },
    {
      label: 'orientation="responsive" (in FieldGroup)',
      render: () => (
        <FieldGroup>
          <Field orientation="responsive">
            <FieldLabel htmlFor="canvas-field-responsive">Key name</FieldLabel>
            <Input id="canvas-field-responsive" placeholder="prod-web" />
          </Field>
        </FieldGroup>
      ),
    },
    {
      label: "FieldError + aria-invalid",
      render: () => (
        <Field orientation="vertical">
          <FieldLabel htmlFor="canvas-field-error">Key name</FieldLabel>
          <Input aria-invalid defaultValue="prod web" id="canvas-field-error" />
          <FieldError>Use letters, numbers and dashes only.</FieldError>
        </Field>
      ),
    },
    {
      label: 'FieldSet + FieldLegend variant="legend"',
      render: () => (
        <FieldSet>
          <FieldLegend variant="legend">Alerts</FieldLegend>
          <FieldDescription>Where budget alerts go.</FieldDescription>
          <Field orientation="horizontal">
            <Checkbox defaultChecked id="canvas-fieldset-email" />
            <FieldLabel htmlFor="canvas-fieldset-email">Email</FieldLabel>
          </Field>
        </FieldSet>
      ),
    },
    {
      label: 'FieldLegend variant="label"',
      render: () => (
        <FieldSet>
          <FieldLegend variant="label">Alerts</FieldLegend>
          <Field orientation="horizontal">
            <Checkbox defaultChecked id="canvas-fieldset-label-email" />
            <FieldLabel htmlFor="canvas-fieldset-label-email">Email</FieldLabel>
          </Field>
        </FieldSet>
      ),
    },
    {
      label: "FieldLabel wrapping Field (choice card)",
      render: () => (
        <RadioGroup defaultValue="soft">
          <FieldLabel htmlFor="canvas-choice-soft">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Soft budget</FieldTitle>
                <FieldDescription>Alert, keep serving.</FieldDescription>
              </FieldContent>
              <RadioGroupItem id="canvas-choice-soft" value="soft" />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="canvas-choice-hard">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Hard budget</FieldTitle>
                <FieldDescription>Block at the limit.</FieldDescription>
              </FieldContent>
              <RadioGroupItem id="canvas-choice-hard" value="hard" />
            </Field>
          </FieldLabel>
        </RadioGroup>
      ),
    },
    {
      label: "FieldSeparator",
      render: () => (
        <FieldGroup>
          <Field orientation="vertical">
            <FieldLabel htmlFor="canvas-separator-a">Key name</FieldLabel>
            <Input id="canvas-separator-a" placeholder="prod-web" />
          </Field>
          <FieldSeparator>or</FieldSeparator>
          <Field orientation="vertical">
            <FieldLabel htmlFor="canvas-separator-b">Key id</FieldLabel>
            <Input id="canvas-separator-b" placeholder="sk-gw-c4aeb3a8" />
          </Field>
        </FieldGroup>
      ),
    },
    {
      label: "data-disabled on Field",
      render: () => (
        <Field data-disabled="true" orientation="vertical">
          <FieldLabel htmlFor="canvas-field-disabled">Key name</FieldLabel>
          <Input disabled id="canvas-field-disabled" placeholder="prod-web" />
          <FieldDescription>Shown in logs and on invoices.</FieldDescription>
        </Field>
      ),
    },
  ],
};

const label: CanvasGroup = {
  id: "label",
  title: "Label",
  files: ["label.tsx"],
  columns: 3,
  examples: [
    {
      label: "default (htmlFor an Input)",
      render: () => (
        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="canvas-label-input">Key name</Label>
          <Input id="canvas-label-input" placeholder="prod-web" />
        </div>
      ),
    },
    {
      label: "wrapping a Checkbox",
      render: () => (
        <Label>
          <Checkbox defaultChecked />
          Email alerts
        </Label>
      ),
    },
  ],
};

const checkbox: CanvasGroup = {
  id: "checkbox",
  title: "Checkbox",
  files: ["checkbox.tsx"],
  columns: 3,
  examples: [
    {
      label: "unchecked",
      render: () => (
        <Label>
          <Checkbox />
          Email alerts
        </Label>
      ),
    },
    {
      label: "defaultChecked",
      render: () => (
        <Label>
          <Checkbox defaultChecked />
          Email alerts
        </Label>
      ),
    },
    {
      label: "indeterminate",
      render: () => (
        <Label>
          <Checkbox indeterminate />
          Email alerts
        </Label>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <Label>
          <Checkbox disabled />
          Email alerts
        </Label>
      ),
    },
    {
      label: "disabled + checked",
      render: () => (
        <Label>
          <Checkbox defaultChecked disabled />
          Email alerts
        </Label>
      ),
    },
    {
      label: "aria-invalid",
      render: () => (
        <Label>
          <Checkbox aria-invalid />
          Email alerts
        </Label>
      ),
    },
  ],
};

const radioGroup: CanvasGroup = {
  id: "radio-group",
  title: "RadioGroup",
  files: ["radio-group.tsx"],
  columns: 3,
  examples: [
    {
      label: 'indicator="dot" (default)',
      render: () => (
        <RadioGroup aria-label="Budget mode" defaultValue="soft">
          <Label>
            <RadioGroupItem value="soft" />
            Soft budget
          </Label>
          <Label>
            <RadioGroupItem value="hard" />
            Hard budget
          </Label>
        </RadioGroup>
      ),
    },
    {
      label: 'indicator="check"',
      render: () => (
        <RadioGroup aria-label="Budget mode" defaultValue="soft">
          <Label>
            <RadioGroupItem indicator="check" value="soft" />
            Soft budget
          </Label>
          <Label>
            <RadioGroupItem indicator="check" value="hard" />
            Hard budget
          </Label>
        </RadioGroup>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <RadioGroup aria-label="Budget mode" defaultValue="soft" disabled>
          <Label>
            <RadioGroupItem value="soft" />
            Soft budget
          </Label>
          <Label>
            <RadioGroupItem value="hard" />
            Hard budget
          </Label>
        </RadioGroup>
      ),
    },
  ],
};

const SWITCH_SIZES = ["sm", "default", "lg"] as const;

const switchGroup: CanvasGroup = {
  id: "switch",
  title: "Switch",
  files: ["switch.tsx"],
  columns: 3,
  examples: [
    ...SWITCH_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => <Switch aria-label="Email alerts" size={size} />,
    })),
    {
      label: "defaultChecked",
      render: () => <Switch aria-label="Email alerts" defaultChecked />,
    },
    {
      label: "disabled",
      render: () => <Switch aria-label="Email alerts" disabled />,
    },
    {
      label: "disabled + checked",
      render: () => (
        <Switch aria-label="Email alerts" defaultChecked disabled />
      ),
    },
  ],
};

const SELECT_SIZES = ["sm", "default", "lg"] as const;

function modelItems() {
  return SAMPLE_MODELS.map((model) => (
    <SelectItem key={model.value} value={model.value}>
      {model.label}
    </SelectItem>
  ));
}

const select: CanvasGroup = {
  id: "select",
  title: "Select",
  files: ["select.tsx"],
  columns: 3,
  examples: [
    ...SELECT_SIZES.map((size) => ({
      label: `size="${size}"`,
      render: () => (
        <Select defaultValue={SAMPLE_MODELS[0].value}>
          <SelectTrigger aria-label="Model" className="w-56" size={size}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{modelItems()}</SelectContent>
        </Select>
      ),
    })),
    {
      label: "placeholder (no value)",
      render: () => (
        <Select>
          <SelectTrigger aria-label="Model" className="w-56">
            <SelectValue placeholder="Choose a model" />
          </SelectTrigger>
          <SelectContent>{modelItems()}</SelectContent>
        </Select>
      ),
    },
    {
      label: "disabled",
      render: () => (
        <Select defaultValue={SAMPLE_MODELS[0].value} disabled>
          <SelectTrigger aria-label="Model" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{modelItems()}</SelectContent>
        </Select>
      ),
    },
    {
      label: "aria-invalid",
      render: () => (
        <Select defaultValue={SAMPLE_MODELS[0].value}>
          <SelectTrigger aria-invalid aria-label="Model" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{modelItems()}</SelectContent>
        </Select>
      ),
    },
    {
      label: "SelectGroup + SelectLabel + SelectSeparator",
      render: () => (
        <Select defaultValue={SAMPLE_MODELS[0].value}>
          <SelectTrigger aria-label="Model" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Anthropic</SelectLabel>
              <SelectItem value={SAMPLE_MODELS[0].value}>
                {SAMPLE_MODELS[0].label}
              </SelectItem>
              <SelectItem value={SAMPLE_MODELS[1].value}>
                {SAMPLE_MODELS[1].label}
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>OpenAI</SelectLabel>
              <SelectItem value={SAMPLE_MODELS[2].value}>
                {SAMPLE_MODELS[2].label}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      ),
    },
    {
      label: "SelectItem disabled",
      render: () => (
        <Select defaultValue={SAMPLE_MODELS[0].value}>
          <SelectTrigger aria-label="Model" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SAMPLE_MODELS.map((model, index) => (
              <SelectItem
                disabled={index === 2}
                key={model.value}
                value={model.value}
              >
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      label: "multiple",
      render: () => (
        <Select defaultValue={[SAMPLE_MODELS[0].value]} multiple>
          <SelectTrigger aria-label="Models" className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>{modelItems()}</SelectContent>
        </Select>
      ),
    },
  ],
};

function comboboxPopup() {
  return (
    <ComboboxContent>
      <ComboboxInput
        aria-label="Search models"
        placeholder="Search models"
        showTrigger={false}
      >
        <InputGroupAddon>
          <Search aria-hidden strokeWidth={1.75} />
        </InputGroupAddon>
      </ComboboxInput>
      <ComboboxEmpty>No models match</ComboboxEmpty>
      <ComboboxList>
        {(item: string) => (
          <ComboboxItem key={item} value={item}>
            {item}
          </ComboboxItem>
        )}
      </ComboboxList>
    </ComboboxContent>
  );
}

const combobox: CanvasGroup = {
  id: "combobox",
  title: "Combobox",
  files: ["combobox.tsx"],
  columns: 3,
  examples: [
    ...SELECT_SIZES.map((size) => ({
      label: `ComboboxTrigger size="${size}"`,
      render: () => (
        <Combobox defaultValue={MODEL_LABELS[0]} items={MODEL_LABELS}>
          <ComboboxTrigger aria-label="Model" className="w-56" size={size}>
            <ComboboxValue />
          </ComboboxTrigger>
          {comboboxPopup()}
        </Combobox>
      ),
    })),
    {
      label: "ComboboxValue placeholder",
      render: () => (
        <Combobox items={MODEL_LABELS}>
          <ComboboxTrigger aria-label="Model" className="w-56" size="default">
            <ComboboxValue placeholder="Choose a model" />
          </ComboboxTrigger>
          {comboboxPopup()}
        </Combobox>
      ),
    },
    {
      label: "ComboboxInput showClear (input mode)",
      render: () => (
        <Combobox defaultValue={MODEL_LABELS[0]} items={MODEL_LABELS}>
          <ComboboxInput
            aria-label="Model"
            className="w-56"
            placeholder="Search models"
            showClear
          />
          <ComboboxContent>
            <ComboboxEmpty>No models match</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ),
    },
    {
      label: "ComboboxInput disabled",
      render: () => (
        <Combobox defaultValue={MODEL_LABELS[0]} items={MODEL_LABELS}>
          <ComboboxInput
            aria-label="Model"
            className="w-56"
            disabled
            placeholder="Search models"
          />
          <ComboboxContent>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      ),
    },
  ],
};

function multiSelectExample(
  props: Partial<ComponentProps<typeof MultiSelect>>,
  initial: string[] = []
) {
  return (
    <Stateful initial={initial}>
      {(value, setValue) => (
        <MultiSelect
          aria-label="Models"
          className="w-56"
          onValueChange={setValue}
          options={SAMPLE_MODEL_OPTIONS}
          placeholder="All models"
          value={value}
          {...props}
        />
      )}
    </Stateful>
  );
}

const TWO_MODELS = [SAMPLE_MODELS[0].value, SAMPLE_MODELS[2].value];

const multiSelect: CanvasGroup = {
  id: "multi-select",
  title: "MultiSelect",
  files: ["multi-select.tsx"],
  columns: 3,
  examples: [
    {
      label: "placeholder (none selected)",
      render: () => multiSelectExample({}),
    },
    {
      label: "2 selected",
      render: () => multiSelectExample({}, TWO_MODELS),
    },
    {
      label: "showSelectedLabels",
      render: () =>
        multiSelectExample({ showSelectedLabels: true }, TWO_MODELS),
    },
    {
      label: "emptyIsAll",
      render: () => multiSelectExample({ emptyIsAll: true }),
    },
    {
      label: "searchable",
      render: () => multiSelectExample({ searchable: true }),
    },
    {
      label: "selectAll={false}",
      render: () => multiSelectExample({ selectAll: false }),
    },
    {
      label: "maxVisibleOptions={3}",
      render: () => multiSelectExample({ maxVisibleOptions: 3 }),
    },
    {
      label: "commitMode minSelected={1}",
      render: () =>
        multiSelectExample({ commitMode: true, minSelected: 1 }, TWO_MODELS),
    },
    {
      label: 'popupWidth="content" + option description',
      render: () =>
        multiSelectExample({
          options: SAMPLE_MODEL_OPTIONS_WITH_DESCRIPTION,
          popupWidth: "content",
        }),
    },
    {
      label: "disabled",
      render: () => multiSelectExample({ disabled: true }, TWO_MODELS),
    },
  ],
};

export const FORM_GROUPS: CanvasGroup[] = [
  input,
  textarea,
  inputGroup,
  searchInput,
  field,
  label,
  checkbox,
  radioGroup,
  switchGroup,
  select,
  combobox,
  multiSelect,
];
