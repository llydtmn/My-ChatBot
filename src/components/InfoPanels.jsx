import PanelShell from "./PanelShell";
import Icon from "./icons";
import {
  ABOUT_SECTIONS,
  CONTACT,
  OWNER_LOCATION,
  OWNER_NAME,
  PRIVACY_SECTIONS,
  PRIVACY_UPDATED,
} from "../data/siteInfo";

function Sections({ sections }) {
  return sections.map((section) => (
    <section className="info-section" key={section.title}>
      <h3>{section.title}</h3>
      {section.body?.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {section.list && (
        <ul>
          {section.list.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </section>
  ));
}

export function AboutPanel(props) {
  return (
    <PanelShell title="About" subtitle="About this system" {...props}>
      <Sections sections={ABOUT_SECTIONS} />
    </PanelShell>
  );
}

export function PrivacyPanel(props) {
  return (
    <PanelShell title="Privacy" subtitle={`What is stored, and why · Updated ${PRIVACY_UPDATED}`} {...props}>
      <Sections sections={PRIVACY_SECTIONS} />
    </PanelShell>
  );
}

export function ContactPanel(props) {
  return (
    <PanelShell title="Contact" subtitle={`${OWNER_NAME} · ${OWNER_LOCATION}`} {...props}>
      <p className="info-lead">Currently open to work. The quickest way to reach {OWNER_NAME} is email or phone.</p>
      <ul className="contact-list">
        {CONTACT.map((item) => {
          const external = item.href.startsWith("http");
          return (
            <li key={item.id}>
              <a
                className="contact-card"
                href={item.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </span>
                {external && <Icon name="external" size={16} />}
              </a>
            </li>
          );
        })}
      </ul>
    </PanelShell>
  );
}
