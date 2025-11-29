# Contributing to CPC

Thank you for your interest in contributing to Common Prosperity Coin! 🎉

## 🤝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Open a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (browser, wallet, etc.)

### Suggesting Features

1. Open an issue with `[Feature Request]` prefix
2. Describe the feature and its benefits
3. Provide use cases
4. Discuss implementation ideas

### Code Contributions

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## 📋 Development Guidelines

### Code Style

- Use consistent formatting
- Add comments for complex logic
- Follow existing patterns
- Keep functions small and focused

### Smart Contracts

- Follow Solidity best practices
- Add comprehensive tests
- Document all functions
- Consider gas optimization
- Use OpenZeppelin libraries

### Frontend

- Keep code modular
- Handle errors gracefully
- Provide user feedback
- Test on multiple browsers
- Ensure mobile compatibility

### Testing

- Write tests for new features
- Maintain test coverage
- Test edge cases
- Include integration tests

## 🔍 Pull Request Process

1. **Before Submitting:**
   - Update documentation
   - Add/update tests
   - Run all tests
   - Check code style
   - Update CHANGELOG if applicable

2. **PR Description:**
   - Describe changes clearly
   - Reference related issues
   - List breaking changes
   - Add screenshots for UI changes

3. **Review Process:**
   - Address review comments
   - Keep PR focused and small
   - Be patient and respectful
   - Update based on feedback

## 🧪 Testing

### Running Tests

```bash
# Contract tests
cd contracts
npx hardhat test

# Specific test
npx hardhat test test/test-comprehensive.js

# With coverage
npx hardhat coverage
```

### Manual Testing

1. Test on local network first
2. Deploy to testnet
3. Verify all functions
4. Check edge cases
5. Test error handling

## 📝 Commit Messages

Use clear, descriptive commit messages:

```
feat: add partial fill support to OTC
fix: resolve OTC order matching bug
docs: update deployment guide
test: add comprehensive OTC tests
refactor: optimize gas usage in OTC
```

Prefixes:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `style`: Formatting
- `chore`: Maintenance

## 🔒 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead:
1. Email: security@cpc-project.com (if available)
2. Use GitHub Security Advisories
3. Provide detailed description
4. Allow time for fix before disclosure

### Security Best Practices

- Never commit private keys
- Use `.env` for sensitive data
- Review all external dependencies
- Follow smart contract security guidelines
- Test thoroughly before deployment

## 📚 Resources

### Learning

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin](https://docs.openzeppelin.com/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

### Tools

- [Remix IDE](https://remix.ethereum.org/)
- [BSCScan](https://bscscan.com/)
- [Hardhat](https://hardhat.org/)
- [MetaMask](https://metamask.io/)

## 🎯 Areas for Contribution

### High Priority

- [ ] Additional test coverage
- [ ] Gas optimization
- [ ] Documentation improvements
- [ ] UI/UX enhancements
- [ ] Mobile optimization

### Medium Priority

- [ ] Additional language support
- [ ] Analytics dashboard
- [ ] Advanced trading features
- [ ] Governance improvements
- [ ] Integration guides

### Low Priority

- [ ] Theme customization
- [ ] Additional wallet support
- [ ] Social features
- [ ] Notification system

## 💬 Communication

### Channels

- **GitHub Issues**: Bug reports, features
- **GitHub Discussions**: General discussion
- **Telegram**: Community chat (if available)
- **Discord**: Development chat (if available)

### Guidelines

- Be respectful and professional
- Stay on topic
- Help others when possible
- Follow code of conduct
- Ask questions if unclear

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## ❓ Questions?

Feel free to:
- Open a discussion on GitHub
- Ask in community channels
- Review existing documentation
- Check FAQ section

---

**Thank you for contributing to CPC! 🚀**
