// export const ReactComponent = 'div';

// const defaultExport = 'SvgrURL';

// export default defaultExport;

import * as React from 'react';

const SvgrMock = React.forwardRef<any, any>((props, ref) => <span ref={ref} {...props} />);
SvgrMock.displayName = 'SvgrMock';

export const ReactComponent = SvgrMock;
export default SvgrMock;
