/* 
Responsive NotifDropdown + ProfileDropdown
Same underlying bug you're right to flag: both are position: absolute; right: 0, anchored to a small button that isn't necessarily near the viewport's right edge — so on narrow screens a 320px/220px panel can overflow past the left edge. 
Fix: switch both to a full-width, fixed panel under the topbar on narrow viewports.
*/

import { useEffect, useState } from 'react';

export function useIsNarrowViewport(breakpoint = 480): boolean {
  const [narrow, setNarrow] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return narrow;

}
