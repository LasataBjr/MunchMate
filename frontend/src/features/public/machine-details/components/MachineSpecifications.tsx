interface MachineSpecificationsProps {
  specifications: string | null;
}

function MachineSpecifications({
  specifications,
}: MachineSpecificationsProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold">
        Specifications
      </h2>

      {specifications ? (
        <div className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-surface-alt p-4 text-fg">
          {specifications}
        </div>
      ) : (
        <p className="mt-3 text-fg-muted">
          Specifications are not available yet.
        </p>
      )}
    </section>
  );
}

export default MachineSpecifications;