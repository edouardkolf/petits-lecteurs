// « Notre méthode » : page factuelle, pour le parent. Sources citées par leur titre seulement (documents publics réels),
// jamais d'adresse profonde inventée, aucune affirmation d'approbation.
import { Icon } from '../../socle/ui/icons/Icon';

export const METHOD_DISCLAIMER = "Petits Lecteurs n'est ni édité ni validé par l'Éducation nationale.";

export function MethodPage(props: { onBack: () => void }) {
  return (
    <div class="pa-space od-method" data-testid="onboarding-method">
      <button type="button" class="pa-back" data-testid="onboarding-method-back" onClick={props.onBack}>
        <Icon name="back" size={22} />
        <span>Retour</span>
      </button>
      <h1>Notre méthode</h1>

      <section class="od-method__section">
        <h2>Les sons avant les lettres</h2>
        <p>
          Avant de lire, l'enfant apprend à écouter : compter les syllabes d'un mot, repérer le son du début ou de la
          fin, trouver les mots qui riment. Les jeux d'écoute et les lettres alternent, une lettre à la fois, associée à son
          son.
        </p>
      </section>

      <section class="od-method__section">
        <h2>Du plus simple au plus difficile</h2>
        <p>
          L'aventure mêle quatre pistes : j'écoute (sons et syllabes), les lettres, j'assemble (syllabes) et, vers la fin,
          je lis (mots entiers). Chaque niveau est un seul jeu, court : il est réussi avec 4 bonnes réponses du premier
          coup sur 5 (6 sur 8 pour les niveaux plus longs). Le niveau suivant ne s'ouvre que lorsque le précédent est
          réussi.
        </p>
      </section>

      <section class="od-method__section">
        <h2>La voix guide, sans lecture</h2>
        <p>
          Toutes les consignes sont dites à voix haute : votre enfant n'a pas besoin de savoir lire pour comprendre
          ce qu'on lui demande. Les textes écrits s'adressent aux parents.
        </p>
      </section>

      <section class="od-method__section">
        <h2>Réviser pour retenir</h2>
        <p>
          Pendant les mini-jeux, de courtes pauses de lecture reviennent sur des lettres déjà rencontrées, pour aider à les
          retenir. Par défaut, une pause arrive après 5 minutes de jeu (3 ou 10 au choix du parent), puis le jeu reprend là
          où il en était.
        </p>
      </section>

      <section class="od-method__section" data-testid="onboarding-method-sources">
        <h2>Sources</h2>
        <ul class="od-method__sources">
          <li>
            Éduscol (eduscol.education.fr), site du ministère de l'Éducation nationale : ressources sur le langage oral et
            sur l'enseignement de la lecture et de l'écriture.
          </li>
          <li>Ministère de l'Éducation nationale, « Pour enseigner la lecture et l'écriture au CP », guide, 2018.</li>
        </ul>
        <p class="od-method__disclaimer" data-testid="onboarding-method-disclaimer">
          {METHOD_DISCLAIMER}
        </p>
      </section>
    </div>
  );
}
