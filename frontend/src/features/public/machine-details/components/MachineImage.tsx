interface MachineImageProps {
  imagePath: string | null;
  machineName: string;
}

function MachineImage({ imagePath, machineName }: MachineImageProps) {
  return (
    <div className="flex min-h-80 items-center justify-center rounded-xl bg-hover">
      {imagePath ? (
        <div className="text-center">
          <p className="text-fg-muted">
            Image uploaded for {machineName}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Image display will be configured later.
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-lg font-medium text-fg-muted">
            No Image Available
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            Machine image will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

export default MachineImage;