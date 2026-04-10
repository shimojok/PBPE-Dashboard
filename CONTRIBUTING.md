# Contributing to PBPE-Dashboard

Thank you for your interest in contributing to the Planetary Bio-Phenome Engine (PBPE) project!

## 🌍 Our Mission

PBPE aims to transform global agriculture into a carbon-positive, financially regenerative system. By contributing, you help create the infrastructure for climate finance market creation.

## 📋 Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## 🔄 Contribution Workflow

### 1. Fork and Clone
```bash
git clone https://github.com/YOUR-USERNAME/PBPE-Dashboard.git
cd PBPE-Dashboard
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test additions

### 3. Development Setup

#### Frontend (React/TypeScript)
```bash
cd dashboard
npm install
npm run dev
```

#### Python Models
```bash
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

### 4. Make Your Changes

- Write clear, commented code
- Follow existing code style
- Add/update tests as needed
- Update documentation

### 5. Commit Guidelines

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add carbon sequestration calculator
fix: resolve yield prediction edge case
docs: update API documentation
test: add unit tests for financial engine
refactor: optimize capital flow calculation
```

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request against the `main` branch.

## ✅ Pull Request Checklist

- [ ] Code compiles without errors
- [ ] Tests pass (`npm test` / `pytest`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Linked to relevant issue (if applicable)

## 🧪 Testing

### Frontend Tests
```bash
cd dashboard
npm test
```

### Python Tests
```bash
pytest tests/
```

## 📚 Documentation

- Update `README.md` if adding major features
- Update relevant files in `docs/` directory
- Maintain both English (`docs/en/`) and Japanese (`docs/ja/`) versions

## 🔍 Code Review Process

1. All PRs require at least one review
2. CI checks must pass
3. Documentation must be complete
4. Breaking changes require discussion

## 🏷️ Issue Guidelines

### Bug Reports
Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node/Python version)

### Feature Requests
Include:
- Problem statement
- Proposed solution
- Alternative considerations
- Impact assessment

## 📞 Contact

- **Discussions**: [GitHub Discussions](https://github.com/your-org/PBPE-Dashboard/discussions)
- **Email**: info@terraviss.com

## 🙏 Acknowledgments

All contributors will be recognized in our [CONTRIBUTORS.md](CONTRIBUTORS.md) file.

---

**Thank you for helping regenerate the planet through code!** 🌱
