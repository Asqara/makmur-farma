"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  DATE_INPUT_CLASS_NAMES,
  DATE_INPUT_COPY,
  DATE_INPUT_WEEKDAY_LABELS,
  FIELD_CLASS_NAMES,
  SELECT_CLASS_NAMES,
} from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Props for accessible form field wrappers.
 */
export type FieldProps = ComponentPropsWithoutRef<"section"> & {
  errorMessage?: string;
  fieldId: string;
  helperText?: string;
  label: string;
  required?: boolean;
};

export function Field({
  children,
  className,
  errorMessage,
  fieldId,
  helperText,
  label,
  required = false,
  ...props
}: FieldProps) {
  const helperId = `${fieldId}-helper`;
  const errorId = `${fieldId}-error`;

  let requiredNode: ReactNode = null;
  if (required) {
    requiredNode = <span aria-hidden="true" className="text-danger">*</span>;
  }

  let helperNode: ReactNode = null;
  if (helperText) {
    helperNode = <span className={FIELD_CLASS_NAMES.helper} id={helperId}>{helperText}</span>;
  }

  let errorNode: ReactNode = null;
  if (errorMessage) {
    errorNode = <span className={FIELD_CLASS_NAMES.error} id={errorId} role="alert">{errorMessage}</span>;
  }

  return (
    <section className={mc(FIELD_CLASS_NAMES.wrapper, className)} {...props}>
      <label className={FIELD_CLASS_NAMES.label} htmlFor={fieldId}>
        {label}
        {requiredNode}
      </label>
      {children}
      {helperNode}
      {errorNode}
    </section>
  );
}

type FieldControlProps = {
  errorMessage?: string;
  helperText?: string;
  id: string;
  label: string;
};

function getDescribedBy({ errorMessage, helperText, id }: FieldControlProps) {
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  if (helperText && errorMessage) return `${helperId} ${errorId}`;
  if (helperText) return helperId;
  if (errorMessage) return errorId;
  return undefined;
}

const dateInputMonthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

const dateInputSelectedFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
});

function getDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getParsedDate(value?: string) {
  if (!value) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getCalendarDays(monthDate: Date) {
  const firstDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDate = new Date(firstDate);
  startDate.setDate(firstDate.getDate() - firstDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

type DropdownPanelPosition = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

function calcDropdownPosition(triggerRect: DOMRect): DropdownPanelPosition {
  const vPad = 8;
  const maxH = 256;
  const spaceBelow = window.innerHeight - triggerRect.bottom - vPad;
  const spaceAbove = triggerRect.top - vPad;
  const above = spaceBelow < 120 && spaceAbove > spaceBelow;
  const maxHeight = above ? Math.min(maxH, spaceAbove) : Math.min(maxH, spaceBelow);
  const top = above ? triggerRect.top - maxHeight - 4 : triggerRect.bottom + 4;
  return { top, left: triggerRect.left, width: triggerRect.width, maxHeight };
}

/**
 * Text Input
 */
export type TextInputProps = Omit<ComponentPropsWithoutRef<"input">, "id"> & FieldControlProps;

export function TextInput({ className, errorMessage, helperText, id, label, required, ...props }: TextInputProps) {
  const describedBy = getDescribedBy({ errorMessage, helperText, id, label });
  const hasError = Boolean(errorMessage);

  return (
    <Field errorMessage={errorMessage} fieldId={id} helperText={helperText} label={label} required={required}>
      <input
        aria-describedby={describedBy}
        aria-invalid={hasError}
        className={mc(FIELD_CLASS_NAMES.control, className)}
        id={id}
        required={required}
        {...props}
      />
    </Field>
  );
}

/**
 * Password Input
 */
export type PasswordInputProps = Omit<TextInputProps, "type"> & {
  hideLabel?: string;
  showLabel?: string;
};

export function PasswordInput({
  className,
  errorMessage,
  helperText,
  hideLabel = "Sembunyikan password",
  id,
  label,
  required,
  showLabel = "Tampilkan password",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const describedBy = getDescribedBy({ errorMessage, helperText, id, label });
  const hasError = Boolean(errorMessage);
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <Field errorMessage={errorMessage} fieldId={id} helperText={helperText} label={label} required={required}>
      <section className="relative">
        <input
          aria-describedby={describedBy}
          aria-invalid={hasError}
          className={mc(FIELD_CLASS_NAMES.control, "pr-11", className)}
          id={id}
          required={required}
          type={visible ? "text" : "password"}
          {...props}
        />
        <button
          aria-label={visible ? hideLabel : showLabel}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-text-muted transition-colors hover:bg-muted-surface hover:text-text-strong"
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          <ToggleIcon aria-hidden="true" className="size-4" />
        </button>
      </section>
    </Field>
  );
}

/**
 * Select Input Option Type
 */
export type SelectInputOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

/**
 * Multi Select Input
 */
export type MultiSelectInputProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "id" | "name" | "onBlur" | "onChange" | "value"
> &
  FieldControlProps & {
    name?: string;
    onBlur?: () => void;
    onValueChange?: (value: string[]) => void;
    options: SelectInputOption[];
    placeholder?: string;
    required?: boolean;
    value?: string[];
  };

export function MultiSelectInput({
  className,
  disabled,
  errorMessage,
  helperText,
  id,
  label,
  name,
  onBlur,
  onValueChange,
  options,
  placeholder = "Pilih beberapa opsi",
  required,
  value = [],
  ...props
}: MultiSelectInputProps) {
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<DropdownPanelPosition>({
    left: 0,
    maxHeight: 256,
    top: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const describedBy = getDescribedBy({ errorMessage, helperText, id, label });
  const listboxId = `${id}-listbox`;

  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label);

  const displayLabel = selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder;
  const selectedValueClassName = selectedLabels.length > 0 ? undefined : SELECT_CLASS_NAMES.placeholder;

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    const updatePosition = () => {
      setPanelPosition(calcDropdownPosition(trigger.getBoundingClientRect()));
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onBlur]);

  const handleToggleOption = (optionValue: string) => {
    const isSelected = value.includes(optionValue);
    const nextValue = isSelected ? value.filter((v) => v !== optionValue) : [...value, optionValue];
    onValueChange?.(nextValue);
  };

  const optionNodes = options.map((option) => {
    const isSelected = value.includes(option.value);
    return (
      <li key={option.value}>
        <button
          aria-selected={isSelected}
          className={mc(SELECT_CLASS_NAMES.option, isSelected && SELECT_CLASS_NAMES.optionActive)}
          disabled={option.disabled}
          onClick={(e) => {
            e.preventDefault();
            handleToggleOption(option.value);
          }}
          role="option"
          type="button"
        >
          {isSelected ? <Check aria-hidden="true" className="size-4 shrink-0 text-primary-blue" /> : <span className="size-4 shrink-0" />}
          <span className="truncate">{option.label}</span>
        </button>
      </li>
    );
  });

  const panelNode = open
    ? createPortal(
        <ul
          ref={panelRef}
          aria-multiselectable="true"
          className={SELECT_CLASS_NAMES.panel}
          id={listboxId}
          role="listbox"
          style={{
            left: panelPosition.left,
            maxHeight: panelPosition.maxHeight,
            position: "fixed",
            top: panelPosition.top,
            width: panelPosition.width,
          }}
        >
          {optionNodes}
        </ul>,
        document.body,
      )
    : null;

  return (
    <Field errorMessage={errorMessage} fieldId={id} helperText={helperText} label={label} required={required}>
      <button
        ref={triggerRef}
        aria-controls={listboxId}
        aria-describedby={describedBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={mc(SELECT_CLASS_NAMES.trigger, className)}
        disabled={disabled}
        id={id}
        onClick={() => setOpen((o) => !o)}
        type="button"
        {...props}
      >
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className={mc(SELECT_CLASS_NAMES.value, selectedValueClassName, "truncate")}>
            {displayLabel}
          </span>
          <ChevronDown aria-hidden="true" className={mc("size-4 shrink-0 text-text-muted transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {panelNode}
    </Field>
  );
}

/**
 * Unified Date Input (Single & Range)
 */
export type DateRangeValue = {
  from: string;
  to: string;
};

type BaseDateInputProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "id" | "name" | "onBlur" | "onChange" | "value"
> &
  FieldControlProps & {
    name?: string;
    onBlur?: () => void;
    placeholder?: string;
    required?: boolean;
  };

type SingleDateProps = BaseDateInputProps & {
  mode?: "single";
  onValueChange?: (value: string) => void;
  value?: string;
};

type RangeDateProps = BaseDateInputProps & {
  mode: "range";
  onValueChange?: (value: DateRangeValue) => void;
  value?: DateRangeValue;
};

/**
 * Props for textarea fields.
 */
export type TextareaInputProps = Omit<
  ComponentPropsWithoutRef<"textarea">,
  "id"
> &
  FieldControlProps;

/**
 * Labeled textarea with helper and error states.
 */
export function TextareaInput({
  className,
  errorMessage,
  helperText,
  id,
  label,
  required,
  ...props
}: TextareaInputProps) {
  const describedBy = getDescribedBy({ errorMessage, helperText, id, label });
  const hasError = Boolean(errorMessage);

  return (
    <Field
      errorMessage={errorMessage}
      fieldId={id}
      helperText={helperText}
      label={label}
      required={required}
    >
      <textarea
        aria-describedby={describedBy}
        aria-invalid={hasError}
        className={mc(FIELD_CLASS_NAMES.textarea, className)}
        id={id}
        required={required}
        {...props}
      />
    </Field>
  );
}

/**
 * Props for select fields.
 */
export type SelectInputProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "children" | "id" | "name" | "onBlur" | "onChange" | "value"
> &
  FieldControlProps & {
    name?: string;
    onBlur?: () => void;
    onValueChange?: (value: string) => void;
    options: SelectInputOption[];
    placeholder?: string;
    required?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    value?: string;
  };

/**
 * Labeled custom select field with optional search filtering and helper/error states.
 * Use searchable prop for large option lists (products, warehouses, categories, suppliers).
 */
export function SelectInput({
  className,
  disabled,
  errorMessage,
  helperText,
  id,
  label,
  name,
  onBlur,
  onValueChange,
  options,
  placeholder = "Pilih opsi",
  required,
  searchable,
  searchPlaceholder = "Cari...",
  value,
  ...props
}: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelPosition, setPanelPosition] = useState<DropdownPanelPosition>({
    left: 0,
    maxHeight: 256,
    top: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const describedBy = getDescribedBy({ errorMessage, helperText, id, label });
  const listboxId = `${id}-listbox`;
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;
  const selectedValueClassName = selectedOption ? undefined : SELECT_CLASS_NAMES.placeholder;

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    if (!trigger) return;

    const updatePosition = () => {
      setPanelPosition(calcDropdownPosition(trigger.getBoundingClientRect()));
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
        onBlur?.();
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onBlur]);

  const visibleOptions =
    searchable && search.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.toLowerCase()),
        )
      : options;

  const optionNodes = visibleOptions.map((option) => {
    const isSelected = option.value === value;
    let checkNode: ReactNode = <span className="size-4 shrink-0" />;

    if (isSelected) {
      checkNode = (
        <Check aria-hidden="true" className="size-4 shrink-0 text-primary-blue" />
      );
    }

    return (
      <li key={option.value}>
        <button
          aria-selected={isSelected}
          className={mc(
            SELECT_CLASS_NAMES.option,
            isSelected && SELECT_CLASS_NAMES.optionActive,
          )}
          disabled={option.disabled}
          onClick={() => {
            onValueChange?.(option.value);
            onBlur?.();
            setOpen(false);
            setSearch("");
          }}
          role="option"
          type="button"
        >
          {checkNode}
          <span className="truncate">{option.label}</span>
        </button>
      </li>
    );
  });

  let listContent: ReactNode;
  if (visibleOptions.length === 0) {
    listContent = (
      <li className="ts-sm px-3 py-4 text-center text-text-muted">
        Tidak ada hasil.
      </li>
    );
  } else {
    listContent = <>{optionNodes}</>;
  }

  let searchInputNode: ReactNode = null;
  if (searchable) {
    searchInputNode = (
      <li className="border-b border-border-default p-1" role="none">
        <input
          autoFocus
          className={mc(FIELD_CLASS_NAMES.control, "h-8 ts-sm")}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          type="text"
          value={search}
        />
      </li>
    );
  }

  const panelNode = open
    ? createPortal(
        <ul
          ref={panelRef}
          className={SELECT_CLASS_NAMES.panel}
          id={listboxId}
          role="listbox"
          style={{
            left: panelPosition.left,
            maxHeight: panelPosition.maxHeight,
            position: "fixed",
            top: panelPosition.top,
            width: panelPosition.width,
          }}
        >
          {searchInputNode}
          {listContent}
        </ul>,
        document.body,
      )
    : null;

  return (
    <Field
      errorMessage={errorMessage}
      fieldId={id}
      helperText={helperText}
      label={label}
      required={required}
    >
      <button
        ref={triggerRef}
        aria-controls={listboxId}
        aria-describedby={describedBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={mc(SELECT_CLASS_NAMES.trigger, className)}
        disabled={disabled}
        id={id}
        onClick={() => setOpen((o) => !o)}
        type="button"
        {...props}
      >
        <span className="flex min-w-0 items-center justify-between gap-3">
          <span className={mc(SELECT_CLASS_NAMES.value, selectedValueClassName)}>
            {selectedLabel}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={mc(
              "size-4 shrink-0 text-text-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </span>
      </button>
      <input
        aria-hidden="true"
        className="sr-only"
        name={name}
        readOnly
        tabIndex={-1}
        value={value ?? ""}
      />
      {panelNode}
    </Field>
  );
}

export type DateInputProps = SingleDateProps | RangeDateProps;

type DatePanelPosition = {
  left: number;
  top: number;
  width: number;
};

export function DateInput(props: DateInputProps) {
  const {
    className,
    disabled,
    errorMessage,
    helperText,
    id,
    label,
    mode = "single",
    name,
    onBlur,
    placeholder = "Pilih tanggal",
    required,
    value,
    onValueChange,
    ...restProps
  } = props;

  const isRange = mode === "range";
  const singleValue = !isRange && typeof value === "string" ? value : "";
  const rangeValue =
    isRange && typeof value === "object" && value !== null
      ? value
      : { from: "", to: "" };

  const parsedFrom = isRange ? getParsedDate(rangeValue.from) : getParsedDate(singleValue);
  const parsedTo = isRange ? getParsedDate(rangeValue.to) : null;

  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(parsedFrom ?? new Date());
  const [panelPosition, setPanelPosition] = useState<DatePanelPosition>({
    left: 0,
    top: 0,
    width: 320,
  });
  const wrapperRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  const describedBy = getDescribedBy({ errorMessage, helperText, id, label });
  const panelId = `${id}-calendar`;
  const calendarDays = getCalendarDays(visibleMonth);

  let selectedLabel = placeholder;
  let hasValue = false;

  if (!isRange && parsedFrom) {
    selectedLabel = dateInputSelectedFormatter.format(parsedFrom);
    hasValue = true;
  } else if (isRange && parsedFrom) {
    if (parsedTo) {
      selectedLabel = `${dateInputSelectedFormatter.format(parsedFrom)} - ${dateInputSelectedFormatter.format(parsedTo)}`;
    } else {
      selectedLabel = `${dateInputSelectedFormatter.format(parsedFrom)} - ...`;
    }
    hasValue = true;
  }

  const selectedValueClassName = hasValue ? undefined : DATE_INPUT_CLASS_NAMES.placeholder;

  const handleDayClick = (dateValue: string, date: Date) => {
    if (!isRange) {
      const onChange = onValueChange as ((val: string) => void) | undefined;
      onChange?.(dateValue);
      setOpen(false);
      onBlur?.();
      return;
    }

    const onChange = onValueChange as ((val: DateRangeValue) => void) | undefined;
    if ((rangeValue.from && rangeValue.to) || !rangeValue.from) {
      onChange?.({ from: dateValue, to: "" });
    } else {
      if (parsedFrom && date < parsedFrom) {
        onChange?.({ from: dateValue, to: "" });
      } else {
        onChange?.({ from: rangeValue.from, to: dateValue });
        setOpen(false);
        onBlur?.();
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const updatePosition = () => {
      const rect = wrapper.getBoundingClientRect();
      const panelWidth = Math.min(320, window.innerWidth - 32);
      const panelHeight = 360;
      const pad = 12;
      const rightOverflow = rect.left + panelWidth > window.innerWidth - pad;
      const spaceBelow = window.innerHeight - rect.bottom - pad;
      const above = spaceBelow < panelHeight && rect.top > spaceBelow;
      const left = rightOverflow ? rect.right - panelWidth : rect.left;
      const top = above ? rect.top - panelHeight - 4 : rect.bottom + 4;
      setPanelPosition({ top, left, width: panelWidth });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !wrapperRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onBlur]);

  const weekDayNodes = DATE_INPUT_WEEKDAY_LABELS.map((day) => (
    <span className={DATE_INPUT_CLASS_NAMES.weekDay} key={day}>
      {day}
    </span>
  ));

  const dayNodes = calendarDays.map((date) => {
    const dateValue = getDateValue(date);
    const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();

    let isSelected = false;
    let isInRange = false;

    if (!isRange) {
      isSelected = singleValue === dateValue;
    } else {
      isSelected = rangeValue.from === dateValue || rangeValue.to === dateValue;
      isInRange = Boolean(
        parsedFrom && parsedTo && date > parsedFrom && date < parsedTo,
      );
    }

    return (
      <button
        aria-pressed={isSelected}
        className={mc(
          DATE_INPUT_CLASS_NAMES.day,
          !isCurrentMonth && DATE_INPUT_CLASS_NAMES.dayMuted,
          isSelected && DATE_INPUT_CLASS_NAMES.daySelected,
          isInRange && "rounded-none bg-primary-blue/10 text-primary-blue",
        )}
        key={dateValue}
        onClick={() => handleDayClick(dateValue, date)}
        type="button"
      >
        {date.getDate()}
      </button>
    );
  });

  const calendarPanel = open
    ? createPortal(
        <section
          ref={panelRef}
          aria-label={`Kalender ${label}`}
          className={DATE_INPUT_CLASS_NAMES.panel}
          id={panelId}
          role="dialog"
          style={{
            left: panelPosition.left,
            position: "fixed",
            top: panelPosition.top,
            width: panelPosition.width,
          }}
        >
          <header className="mb-3 flex items-center justify-between gap-2">
            <button
              aria-label={DATE_INPUT_COPY.previousMonth}
              className="grid size-9 place-items-center rounded-md text-text-muted transition-colors hover:bg-muted-surface hover:text-text-strong"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() - 1,
                    1,
                  ),
                )
              }
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <p className="ts-sm font-semibold text-text-strong">
              {dateInputMonthFormatter.format(visibleMonth)}
            </p>
            <button
              aria-label={DATE_INPUT_COPY.nextMonth}
              className="grid size-9 place-items-center rounded-md text-text-muted transition-colors hover:bg-muted-surface hover:text-text-strong"
              onClick={() =>
                setVisibleMonth(
                  new Date(
                    visibleMonth.getFullYear(),
                    visibleMonth.getMonth() + 1,
                    1,
                  ),
                )
              }
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </header>
          <section className="grid grid-cols-7 gap-1">
            {weekDayNodes}
            {dayNodes}
          </section>
        </section>,
        document.body,
      )
    : null;

  return (
    <Field errorMessage={errorMessage} fieldId={id} helperText={helperText} label={label} required={required}>
      <section
        className={DATE_INPUT_CLASS_NAMES.wrapper}
        ref={wrapperRef}
      >
        <button
          aria-controls={panelId}
          aria-describedby={describedBy}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={mc(DATE_INPUT_CLASS_NAMES.trigger, className)}
          disabled={disabled}
          id={id}
          onClick={() => {
            setVisibleMonth(parsedFrom ?? new Date());
            setOpen((o) => !o);
          }}
          type="button"
          {...restProps}
        >
          <span className={mc(DATE_INPUT_CLASS_NAMES.value, selectedValueClassName)}>
            {selectedLabel}
          </span>
        </button>
        <CalendarDays aria-hidden="true" className={DATE_INPUT_CLASS_NAMES.icon} />
        {calendarPanel}
      </section>
    </Field>
  );
}
