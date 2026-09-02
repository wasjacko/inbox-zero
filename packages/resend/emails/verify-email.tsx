import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Section,
  Text,
} from "@react-email/components";

export type VerifyEmailProps = {
  url: string;
};

export default function VerifyEmail({ url }: VerifyEmailProps) {
  return (
    <Html lang="fr">
      <Head />
      <Body className="bg-gray-50 font-sans">
        <Container className="mx-auto my-10 max-w-[520px] rounded-[20px] bg-white p-8">
          <Text className="m-0 text-[22px] font-semibold text-gray-950">
            Confirmez votre adresse e-mail
          </Text>
          <Text className="mt-4 text-[15px] leading-6 text-gray-600">
            Cliquez sur le bouton ci-dessous pour vérifier que cette adresse
            vous appartient et activer votre compte Freescale.
          </Text>
          <Section className="my-7 text-center">
            <Button
              className="box-border rounded-[10px] bg-blue-600 px-6 py-3 text-[15px] font-semibold text-white no-underline"
              href={url}
            >
              Vérifier mon adresse
            </Button>
          </Section>
          <Text className="m-0 text-[13px] leading-5 text-gray-500">
            Si vous n’avez pas créé ce compte, ignorez cet e-mail. Aucun accès
            ne sera accordé sans cette vérification.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
