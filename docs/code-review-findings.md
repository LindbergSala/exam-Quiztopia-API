# Kodgranskning: identifierade åtgärder

## Stavfel att rätta
- **Problem:** Ordet "kommmer" är felstavat med tre m i handledningsavsnittet i `Instruktioner.md`.
- **Föreslagen aktivitet:** Rätta stavningen till "kommer" för att förbättra dokumentationens kvalitet och trovärdighet.
- **Källa:** `Instruktioner.md`, rad 47.

## Bugg att åtgärda
- **Problem:** `unmarshal` i `src/lib/ddb.mjs` försöker avkoda listvärden genom att anropa sig själv på varje list-element. Elementen är enskilda DynamoDB-attribut (t.ex. `{ S: "foo" }`) och passar inte funktionen som förväntar sig ett helt Item-objekt, vilket leder till felaktig struktur (t.ex. `{ S: "foo" }` i stället för `"foo"`).
- **Föreslagen aktivitet:** Extrahera en hjälpfunktion som hanterar enskilda attribut och använd den för att avkoda både mappar och listor så att listvärden får korrekt typ.
- **Källa:** `src/lib/ddb.mjs`, rader 1–18.

## Dokumentationsavvikelse att korrigera
- **Problem:** README:n påstår att `npm run test` kör "enkla tester", men testkatalogen innehåller endast en `.keep`-fil och inga faktiska tester.
- **Föreslagen aktivitet:** Uppdatera README (eller skapa faktiska tester) så att dokumentationen stämmer med projektets nuvarande status.
- **Källa:** `README.md`, rader 8–12 samt avsaknad av testfiler i `tests/`.

## Testförbättring
- **Problem:** Det saknas test som verifierar att `unmarshal` hanterar listor korrekt, vilket hade upptäckt buggen ovan.
- **Föreslagen aktivitet:** Lägg till ett enhetstest för `unmarshal` som täcker list- och map-strukturer för att säkerställa korrekt konvertering av DynamoDB-data och förhindra regressioner.
- **Källa:** `src/lib/ddb.mjs`, rader 1–18 samt tomma `tests/`-katalogen.
