/** Join conditional class names — tiny alternative to clsx. */
export const cn = (...classes) => classes.filter(Boolean).join(' ');
