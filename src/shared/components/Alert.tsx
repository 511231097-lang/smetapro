import { IconAlertTriangleFilled } from '@tabler/icons-react';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import classes from './Alert.module.css';

export type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

interface AlertProps {
  severity?: AlertSeverity;
  title?: ReactNode;
  description?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert = ({
  severity = 'error',
  title,
  description,
  onClose,
  className,
}: AlertProps) => {
  return (
    <div className={clsx(classes.alert, classes[severity], className)}>
      <div className={classes.iconWrapper}>
        <IconAlertTriangleFilled className={classes.icon} />
      </div>

      <div className={classes.content}>
        {title && <div className={classes.title}>{title}</div>}
        {description && (
          <div className={classes.description}>{description}</div>
        )}
      </div>

      {onClose && (
        <button
          className={classes.closeButton}
          onClick={onClose}
          aria-label="Close alert"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};
