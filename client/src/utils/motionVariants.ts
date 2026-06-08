export const sectionContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}
