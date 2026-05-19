import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Simulação de banco de dados - em produção use um banco real
const users = [
  {
    id: "1",
    email: "demo@prometheus.ai",
    password: "$2b$10$hRG2ptRCv6yh6Q4G9DPjuefE3ikI.LrHnhVUtkEk9SnstGYCL1QiO", // "demo123"
    name: "Usuário Demo",
    createdAt: new Date().toISOString(),
  },
];

const JWT_SECRET = process.env.JWT_SECRET || "prometheus-secret-key";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { message: "E-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Formato de e-mail inválido" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = users.find((u) => u.email === email);
    if (!user) {
      return NextResponse.json(
        { message: "E-mail ou senha incorretos" },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "E-mail ou senha incorretos" },
        { status: 401 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Retornar resposta sem senha
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "Login realizado com sucesso",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
