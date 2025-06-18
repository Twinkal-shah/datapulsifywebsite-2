export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

export const useScrollToTop = () => {
  return () => {
    scrollToTop();
  };
}; 