import ParticleCanvas from "./ParticleCanvas";

export default function BackgroundEffects() {
  return (
    <>
      <div className="scanlines"></div>
      <ParticleCanvas />
      <div className="aurora">
        <div className="aurora-blob"></div>
        <div className="aurora-blob"></div>
        <div className="aurora-blob"></div>
      </div>
    </>
  );
}
