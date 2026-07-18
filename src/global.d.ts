// src/global.d.ts
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';

// If you use CSS modules (.module.css/.module.scss), include typed shape:
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}