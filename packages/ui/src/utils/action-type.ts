import cn from 'clsx';

export type ActionType = 'default' | 'accent' | 'unshield' | 'destructive' | 'success';

export const getColorByActionType = (actionType: ActionType): string => {
  if (actionType === 'destructive') {
    return cn('text-destructive-light');
  }
  return cn('text-text-primary');
};

const OUTLINE_COLOR_MAP: Record<ActionType, string> = {
  default: cn('outline-other-tonalStroke'),
  accent: cn('outline-primary-main'),
  unshield: cn('outline-unshield-main'),
  destructive: cn('outline-destructive-main'),
  success: cn('outline-success-main'),
};

const BEFORE_OUTLINE_COLOR_MAP: Record<ActionType, string> = {
  default: cn('focus:before:outline-action-neutralFocusOutline'),
  accent: cn('focus:before:outline-action-primaryFocusOutline'),
  unshield: cn('focus:before:outline-action-unshieldFocusOutline'),
  destructive: cn('focus:before:outline-action-destructiveFocusOutline'),
  success: cn('focus:before:outline-action-successFocusOutline'),
};

const FOCUS_OUTLINE_COLOR_MAP: Record<ActionType, string> = {
  default: cn('focus:outline-action-neutralFocusOutline'),
  accent: cn('focus:outline-action-primaryFocusOutline'),
  unshield: cn('focus:outline-action-unshieldFocusOutline'),
  destructive: cn('focus:outline-action-destructiveFocusOutline'),
  success: cn('focus:outline-action-successFocusOutline'),
};

const FOCUS_WITHIN_OUTLINE_COLOR_MAP: Record<ActionType, string> = {
  default: cn('focus-within:outline-action-neutralFocusOutline'),
  accent: cn('focus-within:outline-action-primaryFocusOutline'),
  unshield: cn('focus-within:outline-action-unshieldFocusOutline'),
  destructive: cn('focus-within:outline-action-destructiveFocusOutline'),
  success: cn('focus-within:outline-action-successFocusOutline'),
};

const ARIA_CHECKED_OUTLINE_COLOR_MAP: Record<ActionType, string> = {
  default: cn('aria-checked:outline-action-neutralFocusOutline'),
  accent: cn('aria-checked:outline-action-primaryFocusOutline'),
  unshield: cn('aria-checked:outline-action-unshieldFocusOutline'),
  destructive: cn('aria-checked:outline-action-destructiveFocusOutline'),
  success: cn('aria-checked:outline-action-successFocusOutline'),
};

const BORDER_COLOR_MAP: Record<ActionType, string> = {
  default: cn('border-neutral-main'),
  accent: cn('border-primary-main'),
  unshield: cn('border-unshield-main'),
  destructive: cn('border-destructive-main'),
  success: cn('border-success-main'),
};

const BACKGROUND_COLOR_MAP: Record<ActionType, string> = {
  default: cn('bg-neutral-main'),
  accent: cn('bg-primary-main'),
  unshield: cn('bg-unshield-main'),
  destructive: cn('bg-destructive-main'),
  success: cn('bg-success-main'),
};

export const getBeforeOutlineColorByActionType = (actionType: ActionType): string => {
  return BEFORE_OUTLINE_COLOR_MAP[actionType];
};

export const getOutlineColorByActionType = (actionType: ActionType): string => {
  return OUTLINE_COLOR_MAP[actionType];
};

export const getFocusOutlineColorByActionType = (actionType: ActionType): string => {
  return FOCUS_OUTLINE_COLOR_MAP[actionType];
};

export const getFocusWithinOutlineColorByActionType = (actionType: ActionType): string => {
  return FOCUS_WITHIN_OUTLINE_COLOR_MAP[actionType];
};

export const getAriaCheckedOutlineColorByActionType = (actionType: ActionType): string => {
  return ARIA_CHECKED_OUTLINE_COLOR_MAP[actionType];
};

export const getBorderColorByActionType = (actionType: ActionType): string => {
  return BORDER_COLOR_MAP[actionType];
};

export const getBackgroundColorByActionType = (actionType: ActionType): string => {
  return BACKGROUND_COLOR_MAP[actionType];
};
