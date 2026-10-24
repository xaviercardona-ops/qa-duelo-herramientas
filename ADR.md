# ADR-001 · Herramienta de pruebas de interfaz para «____________»

- **Estado:** Propuesta
- **Fecha:** ____-__-__
- **Equipo:** ______________________

> Una página, como en la presentación: contexto, opciones, criterios, decisión y consecuencias. Se escribe para alguien
> que no estuvo en la clase y llega dentro de un año preguntando «¿por qué eligieron esto?». Borren estas líneas al entregar.

## Contexto

_(3 a 5 líneas: quién es el cliente, qué necesita y qué restricciones pesan. Hechos del escenario, sin adjetivos.)_

## Opciones consideradas

Selenium (con Mocha), Cypress y Playwright. La matriz con pesos y puntajes está en [`MATRIZ.md`](MATRIZ.md).
Criterios que más pesaron en este escenario: _(los dos o tres con más peso)_.

## Decisión

Recomendamos **__________** porque _(2 a 4 líneas que citen los criterios que más pesan y los datos del tablero que lo respaldan)_.

## Consecuencias

- **Lo que ganamos:**
- **Lo que perdemos o se complica** _(al menos dos; una decisión sin consecuencias negativas no está completa)_:
- **Lo que tendremos que hacer** _(formación, migración, configuración, presupuesto…)_:

## Qué nos haría cambiar de opinión

_(Dos o tres condiciones concretas y medibles: «si el equipo pasa a trabajar en Python», «si la suite supera las 300 pruebas y el tiempo de CI pasa de 10 minutos», «si el cliente exige Safari»…)_

## ¿Con capa BDD (Cucumber) o sin ella?

_(3 líneas. Usen lo que midieron los equipos de Playwright + Cucumber frente al control (Playwright Test solo): líneas de código, tiempo, minutos de escritura. Y respondan: en este escenario, ¿quién leería los archivos `.feature`?)_

## Evidencia usada

- Tablero de la clase, consultado el ____-__-__ a las __:__ : _(qué datos usaron)_
- Documentación consultada: _(enlaces)_
